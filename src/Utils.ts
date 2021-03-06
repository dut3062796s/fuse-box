import * as path from "path";
import * as fs from 'fs';
import * as fsExtra from 'fs-extra';
const appRoot = require("app-root-path");

const MBLACKLIST = [
    "freelist",
    "sys"
];
export type Concat = {
    add(fileName: string | null, content: string | Buffer, sourceMap?: string): void;
    content: Buffer;
    sourceMap: string;
}
export type ConcatModule = {
    new (generateSourceMap: boolean, outputFileName: string, seperator: string): Concat;
}
export const Concat: ConcatModule = require("concat-with-sourcemaps");

export function contains(array: any[], obj: any) {
    return array && array.indexOf(obj) > -1;
}

export function replaceAliasRequireStatement(requireStatement: string, aliasName: string, aliasReplacement: string) {
    requireStatement = requireStatement.replace(aliasName, aliasReplacement);
    requireStatement = path.normalize(requireStatement)
    return requireStatement;
}
export function write(fileName: string, contents: any) {
    return new Promise((resolve, reject) => {
        fs.writeFile(fileName, contents, (e) => {
            if (e) {
                return reject(e);
            }
            return resolve();
        })
    });
}

export function camelCase(str: string) {
    let DEFAULT_REGEX = /[-_]+(.)?/g;
    function toUpper(match, group1) {
        return group1 ? group1.toUpperCase() : "";
    }
    return str.replace(DEFAULT_REGEX, toUpper);
}

export function parseQuery(qstr) {
    let query = new Map<string, string>();
    let a = qstr.split("&");
    for (let i = 0; i < a.length; i++) {
        let b = a[i].split("=");
        query.set(decodeURIComponent(b[0]), decodeURIComponent(b[1] || ""));
    }
    return query;
}

/**
 * Does two things:
 * - If a relative path is given,
 *  it is assumed to be relative to appRoot and is then made absolute
 * - Ensures that the directory containing the userPath exits (creates it if needed)
 */
export function ensureUserPath(userPath: string) {
    if (!path.isAbsolute(userPath)) {
        userPath = path.join(appRoot.path, userPath);
    }
    userPath = path.normalize(userPath);
    let dir = path.dirname(userPath);

    fsExtra.ensureDirSync(dir);
    return userPath;
}

export function ensureDir(userPath: string) {
    if (!path.isAbsolute(userPath)) {
        userPath = path.join(appRoot.path, userPath);
    }
    userPath = path.normalize(userPath);

    fsExtra.ensureDirSync(userPath);
    return userPath;
}

export function string2RegExp(obj: any) {
    let escapedRegEx = obj
        .replace(/\*/g, "@")
        .replace(/[.?*+[\]-]/g, "\\$&")
        .replace(/@/g, "\\w{1,}", "i");

    if (escapedRegEx.indexOf("$") === -1) {
        escapedRegEx += "$";
    }
    return new RegExp(escapedRegEx);
}

export function removeFolder(userPath) {
    fsExtra.removeSync(userPath)
}


export function replaceExt(npath, ext): string {
    if (typeof npath !== "string") {
        return npath;
    }

    if (npath.length === 0) {
        return npath;
    }
    if (/\.[a-z0-9]+$/i.test(npath)) {
        return npath.replace(/\.[a-z0-9]+$/i, ext);
    } else {
        return npath + ext;
    }
}
export function extractExtension(str: string) {
    const result = str.match(/\.([a-z0-9]+)\$?$/);
    if (!result) {
        throw new Error(`Can't extract extension from string ${str}`);
    }
    return result[1];
}

export function ensurePublicExtension(url: string) {
    let ext = path.extname(url);
    if (ext === ".ts") {
        url = replaceExt(url, ".js");
    }
    if (ext === ".tsx") {
        url = replaceExt(url, ".jsx");
    }
    return url;
}


export function getBuiltInNodeModules(): Array<string> {
    const process: any = global.process;

    return Object.keys(process.binding("natives")).filter(m => {
        return !/^_|^internal|\//.test(m) && MBLACKLIST.indexOf(m) === -1;
    });
}

export function findFileBackwards(target: string, limitPath: string): string {

    let [found, reachedLimit] = [false, false];
    let filename = path.basename(target);
    let current = path.dirname(target);
    let iterations = 0;
    const maxIterations = 10;

    while (found === false && reachedLimit === false) {

        let targetFilePath = path.join(current, filename);
        if (fs.existsSync(targetFilePath)) {
            return targetFilePath;
        }

        if (limitPath === current) {
            reachedLimit = true;
        }
        // going backwards
        current = path.join(current, "..");
        // Making sure we won't have any perpetual loops here
        iterations++;
        if (iterations > maxIterations) {
            reachedLimit = true;
        }
    }
}