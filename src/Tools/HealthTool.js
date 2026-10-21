import os from "node:os";
import fs from "node:fs";
import { getDb, getDbPath } from "./DatabaseTool.js";
import { readRuntimeConfig } from "../../configs/RuntimeConfig.js";

const startTime = Date.now();

export const getLiveness = () => {
  return {
    statusCode: 200,
    body: {
      status: "ok",
      uptimeSeconds: Math.floor((Date.now() - startTime) / 1000),
      timestamp: new Date().toISOString(),
    },
  };
};

export const getReadiness = () => {
  try {
    const db = getDb();
    const result = db.prepare("SELECT 1 as alive").get();
    if (result && result.alive === 1) {
      return {
        statusCode: 200,
        body: {
          status: "ready",
          database: "connected",
          timestamp: new Date().toISOString(),
        },
      };
    }
    return {
      statusCode: 503,
      body: {
        status: "not_ready",
        database: "unhealthy",
        timestamp: new Date().toISOString(),
      },
    };
  } catch (err) {
    return {
      statusCode: 503,
      body: {
        status: "not_ready",
        error: err.message,
        timestamp: new Date().toISOString(),
      },
    };
  }
};

export const getSystemMetrics = () => {
  const db = getDb();
  let dbSizeBytes = 0;
  try {
    const dbPath = getDbPath();
    if (dbPath && fs.existsSync(dbPath)) {
      dbSizeBytes = fs.statSync(dbPath).size;
    }
  } catch {
    // Ignore error
  }

  // Count total sessions and requests
  let totalSessions = 0;
  let totalRequests = 0;
  try {
    totalSessions = db.prepare("SELECT count(*) as count FROM sessions").get()?.count || 0;
    totalRequests = db.prepare("SELECT count(*) as count FROM requests").get()?.count || 0;
  } catch {
    // Ignore error
  }

  // Network IPv4 addresses
  const networkInterfaces = os.networkInterfaces();
  const ipAddresses = [];
  for (const name of Object.keys(networkInterfaces)) {
    for (const net of networkInterfaces[name] || []) {
      if (net.family === "IPv4" && !net.internal) {
        ipAddresses.push({ interface: name, address: net.address });
      }
    }
  }

  const memoryUsage = process.memoryUsage();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();

  return {
    uptime: Math.floor((Date.now() - startTime) / 1000),
    startTime: new Date(startTime).toISOString(),
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    memory: {
      rss: memoryUsage.rss,
      heapUsed: memoryUsage.heapUsed,
      heapTotal: memoryUsage.heapTotal,
      osTotal: totalMem,
      osFree: freeMem,
      osUsedPercent: Math.round(((totalMem - freeMem) / totalMem) * 100),
    },
    cpu: {
      cores: os.cpus().length,
      model: os.cpus()[0]?.model || "Unknown",
      loadAvg: os.loadavg(),
    },
    database: {
      path: getDbPath(),
      sizeBytes: dbSizeBytes,
      totalSessions,
      totalRequests,
    },
    ipAddresses,
    config: readRuntimeConfig().app,
  };
};
