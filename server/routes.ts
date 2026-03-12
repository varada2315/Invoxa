import type { Express } from "express";
import { createServer, type Server } from "http";
import {
  insertInvoiceSchema,
  insertInvoiceTemplateSchema,
  updateInvoiceSchema,
  updateInvoiceStatusSchema,
} from "@shared/schema";
import { storage } from "./storage";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // put application routes here
  // prefix all routes with /api

  // use storage to perform CRUD operations on the storage interface
  // e.g. storage.insertUser(user) or storage.getUserByUsername(username)
  app.get("/api/invoice-templates", async (_req, res, next) => {
    try {
      const templates = await storage.listInvoiceTemplates();
      res.json(templates);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/invoice-templates", async (req, res, next) => {
    try {
      const parsed = insertInvoiceTemplateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          message: "Invalid invoice template payload",
          errors: parsed.error.flatten(),
        });
      }

      const template = await storage.createInvoiceTemplate(parsed.data);
      return res.status(201).json(template);
    } catch (error) {
      return next(error);
    }
  });

  app.get("/api/invoices", async (_req, res, next) => {
    try {
      const invoices = await storage.listInvoices();
      res.json(invoices);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/invoices", async (req, res, next) => {
    try {
      const parsed = insertInvoiceSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          message: "Invalid invoice payload",
          errors: parsed.error.flatten(),
        });
      }

      const invoice = await storage.createInvoice(parsed.data);
      return res.status(201).json(invoice);
    } catch (error) {
      return next(error);
    }
  });

  app.patch("/api/invoices/:id/status", async (req, res, next) => {
    try {
      const parsed = updateInvoiceStatusSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          message: "Invalid invoice status payload",
          errors: parsed.error.flatten(),
        });
      }

      const updatedInvoice = await storage.updateInvoiceStatus(
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

  app.put("/api/invoices/:id", async (req, res, next) => {
    try {
      const parsed = updateInvoiceSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          message: "Invalid invoice payload",
          errors: parsed.error.flatten(),
        });
      }

      const updatedInvoice = await storage.updateInvoice(req.params.id, parsed.data);
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
