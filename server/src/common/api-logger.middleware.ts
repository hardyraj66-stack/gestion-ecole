import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class ApiLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('API');

  use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();
    const { method, originalUrl, ip } = req;
    const origin = req.headers.origin || req.headers.referer || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    const timestamp = new Date().toISOString();

    res.on('finish', () => {
      const duration = Date.now() - start;
      const { statusCode } = res;

      const logEntry = {
        timestamp,
        method,
        endpoint: originalUrl,
        statusCode,
        duration: `${duration}ms`,
        origin,
        ip,
        userAgent: userAgent.substring(0, 80),
      };

      const line = `[${logEntry.method}] ${logEntry.endpoint} → ${logEntry.statusCode} (${logEntry.duration}) | origin: ${logEntry.origin} | ip: ${logEntry.ip}`;

      if (statusCode >= 400) {
        this.logger.warn(line);
      } else {
        this.logger.log(line);
      }
    });

    next();
  }
}
