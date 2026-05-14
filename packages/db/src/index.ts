export { db } from "./client";
export type { DB } from "./client";
export { users, sessions, accounts, verifications } from "./schema/auth";
export { instanceConfig, providerKeys } from "./schema/instance";
export { personas } from "./schema/personas";
export { debates, debatePersonas, debateTurns, factChecks } from "./schema/debates";
export { streamEvents } from "./schema/stream-events";
export { articles, clusters, clusterArticles } from "./schema/news";
export type {
  User,
  NewUser,
  Session,
  NewSession,
  Account,
  NewAccount,
  Verification,
  NewVerification,
} from "./schema/auth";
export type {
  InstanceConfig,
  NewInstanceConfig,
  ProviderKey,
  NewProviderKey,
} from "./schema/instance";
export type { Persona, NewPersona } from "./schema/personas";
export type {
  Debate,
  NewDebate,
  DebatePersona,
  NewDebatePersona,
  DebateTurn,
  NewDebateTurn,
  FactCheck,
  NewFactCheck,
} from "./schema/debates";
export type { StreamEvent, NewStreamEvent } from "./schema/stream-events";
export type {
  Article,
  NewArticle,
  Cluster,
  NewCluster,
  ClusterArticle,
  NewClusterArticle,
} from "./schema/news";
export {
  and,
  asc,
  cosineDistance,
  desc,
  eq,
  gt,
  gte,
  inArray,
  isNotNull,
  isNull,
  lte,
  notInArray,
  or,
  sql,
} from "drizzle-orm";
