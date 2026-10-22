import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { RpcException } from '@nestjs/microservices';
import { status as GrpcStatus } from '@grpc/grpc-js';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    if (host.getType() === 'http') {
      const ctx = host.switchToHttp();
      const res = ctx.getResponse<Response>();
      const { statusCode, body } = this.normalize(exception);
      res.status(statusCode).json(body);
      return;
    }

    throw exception;
  }

  private normalize(exception: unknown): {
    statusCode: number;
    body: {
      statusCode: number;
      code: string;
      message: string;
      details?: unknown;
    };
  } {
    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const payload = exception.getResponse();
      const message =
        typeof payload === 'string'
          ? payload
          : ((payload as { message?: string | string[] }).message ??
            exception.message);
      return {
        statusCode,
        body: {
          statusCode,
          code: exception.name,
          message: Array.isArray(message) ? message.join(', ') : message,
          details: typeof payload === 'object' ? payload : undefined,
        },
      };
    }

    this.logger.error(exception);
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      body: {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
      },
    };
  }
}

export function toRpcException(error: unknown): RpcException {
  if (error instanceof HttpException) {
    const statusCode = error.getStatus();
    const map: Record<number, GrpcStatus> = {
      400: GrpcStatus.INVALID_ARGUMENT,
      401: GrpcStatus.UNAUTHENTICATED,
      403: GrpcStatus.PERMISSION_DENIED,
      404: GrpcStatus.NOT_FOUND,
      409: GrpcStatus.ALREADY_EXISTS,
    };
    return new RpcException({
      code: map[statusCode] ?? GrpcStatus.UNKNOWN,
      message: error.message,
    });
  }
  if (error instanceof RpcException) {
    return error;
  }
  return new RpcException({
    code: GrpcStatus.UNKNOWN,
    message: error instanceof Error ? error.message : 'Internal error',
  });
}
