import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { YuqueService } from "./services/yuque";
import express, { Request, Response } from "express";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import {
  getFixedQuery,
  mcpHook_updateMessageBody,
  mcpHook_updateMessageEndpoint,
} from "./mcp_hook";
import { registerAllTools, displayAvailableTools } from "./tools";
import { registerAllPrompts, displayAvailablePrompts } from "./prompts";
import { registerAllResources, displayAvailableResources } from "./resources";

// Logger with timestamp - defaults to console, switches to MCP logging after connect
export const Logger = {
  log: (...args: unknown[]) => console.log(`[${new Date().toISOString()}] [Yuque MCP]`, ...args),
  error: (...args: unknown[]) =>
    console.error(`[${new Date().toISOString()}] [Yuque MCP Error]`, ...args),
};

export class YuqueMcpServer {
  private readonly server: McpServer;
  private yuqueApiToken: string;
  private yuqueApiBaseUrl: string;

  constructor(yuqueApiToken: string, yuqueApiBaseUrl: string) {
    this.yuqueApiToken = yuqueApiToken;
    this.yuqueApiBaseUrl = yuqueApiBaseUrl;
    this.server = new McpServer(
      {
        name: "Yuque MCP Server",
        version: "0.1.0",
      },
      {
        capabilities: {
          logging: {},
          tools: {},
          prompts: {
            listChanged: true,
          },
          resources: {
            subscribe: true,
            listChanged: true,
          },
        },
      }
    );

    this.registerTools();
    this.registerPrompts();
    this.registerResources();
  }

  /**
   * Create YuqueService instance helper method
   * Note: Use || instead of ?? because empty string should also fallback to env token
   */
  private createYuqueService(accessToken: string | undefined): YuqueService {
    return new YuqueService(accessToken || this.yuqueApiToken, this.yuqueApiBaseUrl);
  }

  /**
   * Register all MCP tools using modular tool registration
   */
  private registerTools(): void {
    registerAllTools(this.server, (accessToken) => this.createYuqueService(accessToken));
  }

  /**
   * Register all MCP prompts using modular prompt registration
   */
  private registerPrompts(): void {
    registerAllPrompts(this.server, (accessToken) => this.createYuqueService(accessToken));
  }

  /**
   * Register all MCP resources using modular resource registration
   */
  private registerResources(): void {
    registerAllResources(this.server, (accessToken) => this.createYuqueService(accessToken));
  }

  async connect(transport: Transport): Promise<void> {
    await this.server.connect(transport);

    Logger.log = (...args: unknown[]) => {
      this.server.server.sendLoggingMessage({
        level: "info",
        data: args,
      });
    };

    Logger.error = (...args: unknown[]) => {
      this.server.server.sendLoggingMessage({
        level: "error",
        data: args,
      });
    };

    Logger.log("Yuque MCP Server connected and ready to process requests");
  }

  /**
   * Display available tools to the console
   */
  displayAvailableTools(): void {
    displayAvailableTools();
    displayAvailablePrompts();
    displayAvailableResources();
  }

  async startHttpServer(port: number): Promise<void> {
    const app = express();
    const transports: { [sessionId: string]: SSEServerTransport } = {};

    // Health check endpoint
    app.get("/health", (_req, res) => {
      const memoryUsage = process.memoryUsage();
      res.status(200).json({
        status: "ok",
        version: "0.1.0",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: {
          rss: Math.round(memoryUsage.rss / 1024 / 1024) + "MB",
          heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + "MB",
          heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + "MB",
        },
      });
    });

    // Request logging middleware
    app.use((req, res, next) => {
      Logger.log(`${req.method} ${req.url}`);
      next();
    });

    app.get("/sse", async (req: Request, res: Response) => {
      try {
        const hookUrl = mcpHook_updateMessageEndpoint(req);
        console.log("hookUrl: " + hookUrl);
        const transport = new SSEServerTransport(hookUrl, res);
        transports[transport.sessionId] = transport;
        res.on("close", () => {
          delete transports[transport.sessionId];
        });
        await this.server.connect(transport);
      } catch (error) {
        Logger.error("Error connecting to SSE: " + error);
        res.status(500).send("Error connecting to SSE");
      }
    });

    app.post("/messages", async (req: Request, res: Response) => {
      const sessionId = getFixedQuery(req.query as Record<string, string>)["sessionId"];
      const transport = transports[sessionId];
      try {
        if (!transport) {
          res.status(400).send("No transport found for sessionId");
          return;
        }
        try {
          // Process request and get message content
          const messageContent = await mcpHook_updateMessageBody(req);

          // Call handleMessage with processed message content
          await transport.handleMessage(messageContent);

          // Return success response
          if (!res.headersSent) {
            res.status(202).send("Accepted");
          }
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          Logger.error("Error handling message: " + error);
          if (!res.headersSent) {
            res.status(500).send(`Error handling message: ${errorMessage}`);
          }
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        Logger.error("Error in messages route: " + error);
        if (!res.headersSent) {
          res.status(500).send(`Server error: ${errorMessage}`);
        }
      }
    });

    app.listen(port, () => {
      Logger.log(`Yuque MCP HTTP server listening on port ${port}`);
      Logger.log(`SSE endpoint available at http://localhost:${port}/sse`);
      Logger.log(`Message endpoint available at http://localhost:${port}/messages`);

      // Display available tools
      this.displayAvailableTools();
    });
  }
}
