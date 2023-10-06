/**
 * Instant API Handler for Vercel
 * This will bootstrap your Instant API server
 * All requests to your app are redirected here via `vercel.json`
 * And then subsequently routed to the appropriate endpoint in
 *   your `functions/` or `www/` folder
 */

import InstantAPI from '@instant.dev/api';
import dotenv from 'dotenv';

const ENVIRONMENT = process.env.VERCEL_ENV || process.env.NODE_ENV || 'development';
dotenv.config({path: `.env.${ENVIRONMENT}`});

const gateway = new InstantAPI.Daemon.Gateway({
  debug: ENVIRONMENT !== 'production'
});
gateway.load(process.cwd());

export default function handler (req, res) {
  // Do not automatically compress responses in Vercel
  delete req.headers['accept-encoding'];
  // Handle the HTTP Request
  gateway.__httpHandler__(req, res);
};