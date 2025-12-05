#!/usr/bin/env node

import { execSync } from 'child_process';
import path from 'path';

const ALLOWED_BINARIES = ['aikido-pnpm', 'sfw'];
const SCRIPT_EXTENSIONS = /\.(exe|cmd|js|cjs|mjs)$/i;
const IS_WINDOWS = process.platform === 'win32';

/**
 * Parse a command line string into arguments.
 * Handles quoted paths with spaces (e.g., "C:\Program Files\node.exe").
 */
const parseCommandLine = cmd => {
    const normalized = cmd.replace(/""+/g, '"').trim(); // Normalize Windows PowerShell doubled quotes
    if (!normalized) return [];

    // Match tokens: bare words or "quoted strings", can be adjacent
    // e.g. 'foo "bar baz" qux' → ['foo', '"bar baz"', 'qux']
    // e.g. '"C:\Program Files\node.exe" script.js' → ['"C:\Program Files\node.exe"', 'script.js']
    return normalized
        .match(/(?:[^\s"]+|"[^"]*")+/g)
        .map(token => token.replace(/"/g, ''));
};

const getBasename = target =>
    path.basename(target).replace(SCRIPT_EXTENSIONS, '');

/**
 * Extract the binary name from a command line string.
 * Handles "node script.js" by returning the script name.
 */
const extractBinaryName = cmd => {
    const parts = parseCommandLine(cmd);
    const first = parts[0] ?? '';
    const target = getBasename(first) === 'node' && parts[1] ? parts[1] : first;
    return getBasename(target);
};

/**
 * Walk up the process tree and collect command lines.
 */
function getProcessTree() {
    const tree = [];
    let pid = process.pid;

    try {
        if (IS_WINDOWS) {
            while (pid > 0) {
                const csv = execSync(
                    `powershell -Command "Get-CimInstance Win32_Process -Filter 'ProcessId=${pid}' | Select-Object ParentProcessId,CommandLine | ConvertTo-Csv -NoTypeInformation"`,
                    { encoding: 'utf8' },
                );
                const match = csv.match(/"(\d+)","(.*)"/);
                if (!match) break;
                const [, ppid, cmdLine] = match;
                if (cmdLine) tree.push(cmdLine);
                pid = parseInt(ppid, 10);
            }
        } else {
            while (pid > 1) {
                const info = execSync(`ps -p ${pid} -o ppid=,args=`, {
                    encoding: 'utf8',
                }).trim();
                const [ppid, ...cmdParts] = info.split(/\s+/);
                tree.push(cmdParts.join(' '));
                pid = parseInt(ppid, 10);
            }
        }
    } catch {
        // Process tree lookup failed, continue with what we have
    }

    return tree;
}

/**
 * Check if the process was started through an allowed wrapper.
 */
function isRunningThroughAllowedWrapper() {
    const tree = getProcessTree();
    return tree.some(cmd => ALLOWED_BINARIES.includes(extractBinaryName(cmd)));
}

// Main
if (!isRunningThroughAllowedWrapper()) {
    const RED = '\x1b[31m\x1b[1m';
    const RESET = '\x1b[0m';

    console.error(`
${RED}╭─────────────────────────────────────────────────────────────────╮${RESET}
${RED}│                                                                 │${RESET}
${RED}│   ERROR: Direct package manager usage is not allowed!           │${RESET}
${RED}│                                                                 │${RESET}
${RED}│   Please use one of the following instead:                      │${RESET}
${RED}│     - aikido-pnpm install                                       │${RESET}
${RED}│     - sfw pnpm install                                          │${RESET}
${RED}│                                                                 │${RESET}
${RED}╰─────────────────────────────────────────────────────────────────╯${RESET}
`);
    process.exit(1);
}
