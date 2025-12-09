import { createRouter } from "next-connect";
import database from "infra/database.js";
import controller from "infra/controller.js";

const router = createRouter();

router.get(getHandler);

export default router.handler(controller.errorsHandlers);

async function getHandler(request, response) {
  const updatedAt = new Date().toISOString();

  const queryVersionResult = await database.query("SHOW server_version;");
  const databaseVersion = queryVersionResult.rows[0].server_version;

  const queryMaxConnectionsResult = await database.query(
    "SHOW max_connections;",
  );
  const maxConnections = queryMaxConnectionsResult.rows[0].max_connections;

  const databaseName = process.env.POSTGRES_DB;

  const queryOpenedConnectionsResult = await database.query({
    text: "SELECT count(*)::int FROM pg_stat_activity WHERE datname = $1",
    values: [databaseName],
  });

  const openedConnections = queryOpenedConnectionsResult.rows[0].count;

  response.status(200).json({
    updated_at: updatedAt,
    dependencies: {
      database: {
        version: databaseVersion,
        max_connections: parseInt(maxConnections),
        opened_connections: openedConnections,
      },
    },
  });
}
