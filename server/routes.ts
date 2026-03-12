import type { Express } from "express";
import { type Server } from "http";
import {
  insertInvoiceSchema,
  insertInvoiceTemplateSchema,
  loginSchema,
  signupSchema,
  updateInvoiceSchema,
  updateInvoiceStatusSchema,
} from "@shared/schema";
import { requireAuth, toPublicUser, verifyPassword } from "./auth";
import { storage } from "./storage";

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {
  app.get("/api/auth/me", async (req, res, next) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user) {
        req.session.destroy(() => undefined);
        return res.status(401).json({ message: "Not authenticated" });
      }

      return res.json(toPublicUser(user));
    } catch (error) {
      return next(error);
    }
  });

  app.post("/api/auth/signup", async (req, res, next) => {
    try {
      const parsed = signupSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          message: "Invalid signup payload",
          errors: parsed.error.flatten(),
        });
      }

      const user = await storage.createUser(parsed.data);
      req.session.userId = user.id;
      return res.status(201).json(toPublicUser(user));
    } catch (error) {
      return next(error);
    }
  });

  app.post("/api/auth/login", async (req, res, next) => {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          message: "Invalid login payload",
          errors: parsed.error.flatten(),
        });
      }

      const user = await storage.getUserByEmail(parsed.data.email);
      if (!user || !verifyPassword(parsed.data.password, user.passwordHash)) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      req.session.userId = user.id;
      return res.json(toPublicUser(user));
    } catch (error) {
      return next(error);
    }
  });

  app.post("/api/auth/logout", (req, res, next) => {
    req.session.destroy((error) => {
      if (error) {
        return next(error);
      }

      res.clearCookie("connect.sid");
      return res.status(204).end();
    });
  });

  app.get("/api/invoice-templates", requireAuth, async (req, res, next) => {
    try {
      const templates = await storage.listInvoiceTemplates(req.session.userId!);
      res.json(templates);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/invoice-templates", requireAuth, async (req, res, next) => {
    try {
      const parsed = insertInvoiceTemplateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          message: "Invalid invoice template payload",
          errors: parsed.error.flatten(),
        });
      }

      const template = await storage.createInvoiceTemplate(req.session.userId!, parsed.data);
      return res.status(201).json(template);
    } catch (error) {
      return next(error);
    }
  });

  app.get("/api/invoices", requireAuth, async (req, res, next) => {
    try {
      const invoices = await storage.listInvoices(req.session.userId!);
      res.json(invoices);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/invoices", requireAuth, async (req, res, next) => {
    try {
      const parsed = insertInvoiceSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          message: "Invalid invoice payload",
          errors: parsed.error.flatten(),
        });
      }

      const invoice = await storage.createInvoice(req.session.userId!, parsed.data);
      return res.status(201).json(invoice);
    } catch (error) {
      return next(error);
    }
  });

  app.patch("/api/invoices/:id/status", requireAuth, async (req, res, next) => {
    try {
      const parsed = updateInvoiceStatusSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          message: "Invalid invoice status payload",
          errors: parsed.error.flatten(),
        });
      }

      const updatedInvoice = await storage.updateInvoiceStatus(
        req.session.userId!,
        req.params.id,
        parsed.data.status,
      );
      if (!updatedInvoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      return res.json(updatedInvoice);
    } catch (error) {
      return next(error);
    }
  });

  app.put("/api/invoices/:id", requireAuth, async (req, res, next) => {
    try {
      const parsed = updateInvoiceSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          message: "Invalid invoice payload",
          errors: parsed.error.flatten(),
        });
      }

      const updatedInvoice = await storage.updateInvoice(
        req.session.userId!,
        req.params.id,
        parsed.data,
      );
      if (!updatedInvoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      return res.json(updatedInvoice);
    } catch (error) {
      return next(error);
    }
  });

  return httpServer;
}
