const osu = require('os-utils');
const checkDisk = require('check-disk-space');
const { exec } = require('child_process');

class ToolsHelper {
    static async sleep(ms = 1000) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    static async foreach(arr, func) {
        for (let i in arr) {
            const response = await func(i, arr[i]);

            if (response !== true && response !== false) {
                logs.error('FALHA AO UTILIZAR O ToolsHelper.foreach! Você precisa setar um return true se quiser deixar o loop continuar e return false se deseja interromper.');
            }

            if (response === false) {
                break;
            }
        }
    }

    static async inArray(needle, haystack) {
        for (let item of haystack) {
            if (typeof item === 'object') {
                if (await ToolsHelper.arrayCompare(item, needle)) return true;
            } else {
                if (item === needle) return true;
            }
        }
        return false;
    }

    static async arrayCompare(a1, a2) {
        if (a1.length !== a2.length) return false;
        return a1.every((value, index) => value === a2[index]);
    }

    static toTimestamp(strDate) {
        return new Date(strDate).getTime() / 1000;
    }

    static getCpuFree() {
        return new Promise(resolve => {
            osu.cpuFree(cpuFree => {
                resolve(Math.round(cpuFree * 100));
            });
        });
    }

    static getCpuUsage() {
        return new Promise(resolve => {
            osu.cpuUsage(cpuUsage => {
                resolve(Math.round(cpuUsage * 100));
            });
        });
    }

    static async getDiskUsage(platform) {
        let path = platform === 'win32' ? 'C://' : '/';
        const diskSpace = await checkDisk.default(path);

        let disk = {
            total: diskSpace.size,
            free: diskSpace.free,
        };
        disk.used = disk.total - disk.free;
        disk.usedPercentage = Math.round((disk.used / disk.total) * 100);
        disk.freePercentage = Math.round((disk.free / disk.total) * 100);

        disk.total = this.formatBytes(disk.total);
        disk.free = this.formatBytes(disk.free);
        disk.used = this.formatBytes(disk.used);

        return disk;
    }

    static isRunningProcess(processName) {
        const cmd = (() => {
            switch (process.platform) {
                case 'win32':
                    return 'tasklist';
                case 'darwin':
                case 'linux':
                    return `ps -ax | grep ${processName}`;
                default:
                    return null;
            }
        })();

        if (!cmd) return Promise.resolve(false);

        return new Promise(resolve => {
            exec(cmd, (err, stdout) => {
                resolve(stdout.toLowerCase().includes(processName.toLowerCase()));
            });
        });
    }

    static formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    static justNumbers(string) {
        return parseInt(string.replace(/[^0-9]/g, ''), 10);
    }

    static handleError(phone, error) {
        logs.error(`${phone} | ${error.message}`);
        return { success: false, msg: error.message, error: true };
    };
}

module.exports = ToolsHelper;
