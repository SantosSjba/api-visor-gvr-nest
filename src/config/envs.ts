/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import 'dotenv/config';
import * as joi from 'joi';

interface EnvsVars {
  PORT: number;
  NODE_ENV: string;
  DB_HOST?: string;
  DB_PORT?: number;
  DB_USERNAME?: string;
  DB_PASSWORD?: string;
  DB_DATABASE?: string;
  DB_SYNCHRONIZE: boolean;
  DB_LOGGING: boolean;
  DATABASE_URL?: string;
  FRONTEND_URLS: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  AUTODESK_CLIENT_ID: string;
  AUTODESK_CLIENT_SECRET: string;
  AUTODESK_CALLBACK_URL: string;
}

const envSchema = joi
  .object<EnvsVars>({
    PORT: joi.number().default(4001),
    NODE_ENV: joi.string().valid('development', 'production', 'test').default('development'),
    DB_HOST: joi.string().optional().allow(''),
    DB_PORT: joi.number().optional(),
    DB_USERNAME: joi.string().optional().allow(''),
    DB_PASSWORD: joi.string().optional().allow(''),
    DB_DATABASE: joi.string().optional().allow(''),
    DB_SYNCHRONIZE: joi.boolean().default(false),
    DB_LOGGING: joi.boolean().default(false),
    DATABASE_URL: joi.string().optional().allow(''),
    FRONTEND_URLS: joi.string().required(),
    JWT_SECRET: joi.string().required(),
    JWT_EXPIRES_IN: joi.string().required(),
    AUTODESK_CLIENT_ID: joi.string().required(),
    AUTODESK_CLIENT_SECRET: joi.string().required(),
    AUTODESK_CALLBACK_URL: joi.string().required(),
  })
  .unknown(true);

const { error, value: validatedEnv } = envSchema.validate(process.env);

if (error) {
  throw new Error(`Error de validación de configuración: ${error.message}`);
}

const envsVars: EnvsVars = validatedEnv;

export const envs = {
  port: envsVars.PORT,
  nodeEnv: envsVars.NODE_ENV,
  dbHost: envsVars.DB_HOST,
  dbPort: envsVars.DB_PORT,
  dbUsername: envsVars.DB_USERNAME,
  dbPassword: envsVars.DB_PASSWORD,
  dbDatabase: envsVars.DB_DATABASE,
  dbSynchronize: envsVars.DB_SYNCHRONIZE,
  dbLogging: envsVars.DB_LOGGING,
  databaseUrl: envsVars.DATABASE_URL,
  frontendUrls: envsVars.FRONTEND_URLS.split(','),
  jwtSecret: envsVars.JWT_SECRET,
  jwtExpiresIn: envsVars.JWT_EXPIRES_IN,
  autodeskClientId: envsVars.AUTODESK_CLIENT_ID,
  autodeskClientSecret: envsVars.AUTODESK_CLIENT_SECRET,
  autodeskCallbackUrl: envsVars.AUTODESK_CALLBACK_URL,
};

