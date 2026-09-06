import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "./redis";

// Create a new ratelimiter, that allows 5 requests per 1 minute (anti-bot)
export const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(5, "1 m"),
  analytics: true,
  prefix: "custom-link-ratelimit",
});

// Anonymous user quota: 5 links per 7 days
export const anonQuotaLimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(5, "7 d"),
  analytics: true,
  prefix: "anon_quota",
});

