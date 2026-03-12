import {
  type User,
  type SignupInput,
  type InsertInvoiceTemplate,
  type InvoiceTemplate,
  type InsertInvoice,
  type Invoice,
  type InvoiceStatus,
  type UpdateInvoice,
  invoiceTemplateSchema,
  invoiceSchema,
  userSchema,
} from "@shared/schema";
import { randomUUID } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { hashPassword } from "./auth";

const DEFAULT_ACCOUNT = {
  name: "Varada",
  email: "varadakumbhar2004@gmail.com",
  password: "varada",
};

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: SignupInput): Promise<User>;
  listInvoiceTemplates(userId: string): Promise<InvoiceTemplate[]>;
  createInvoiceTemplate(userId: string, template: InsertInvoiceTemplate): Promise<InvoiceTemplate>;
  listInvoices(userId: string): Promise<Invoice[]>;
  createInvoice(userId: string, invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(userId: string, id: string, invoice: UpdateInvoice): Promise<Invoice | undefined>;
  updateInvoiceStatus(userId: string, id: string, status: InvoiceStatus): Promise<Invoice | undefined>;
}

export class MemStorage implements IStorage {
  private users = new Map<string, User>();
  private invoiceTemplates = new Map<string, InvoiceTemplate>();
  private invoices = new Map<string, Invoice>();
  private usersLoaded = false;
  private templatesLoaded = false;
  private invoicesLoaded = false;
  private readonly usersFilePath = path.join(process.cwd(), "server", "data", "users.json");
  private readonly templatesFilePath = path.join(process.cwd(), "server", "data", "invoice-templates.json");
  private readonly invoicesFilePath = path.join(process.cwd(), "server", "data", "invoices.json");
  private userWriteQueue: Promise<void> = Promise.resolve();
  private templateWriteQueue: Promise<void> = Promise.resolve();
  private invoiceWriteQueue: Promise<void> = Promise.resolve();
  private bootstrapPromise: Promise<void> | null = null;

  private enqueueWrite(queue: Promise<void>, filePath: string, data: string): Promise<void> {
    return queue.then(async () => {
      await mkdir(path.dirname(filePath), { recursive: true });
      await writeFile(filePath, data, "utf8");
    });
  }

  private async ensureUsersLoaded(): Promise<void> {
    if (this.usersLoaded) {
      return;
    }

    try {
      const fileContent = await readFile(this.usersFilePath, "utf8");
      const parsed = JSON.parse(fileContent);
      const users = Array.isArray(parsed) ? parsed : [];

      for (const user of users) {
        const validated = userSchema.safeParse(user);
        if (validated.success) {
          this.users.set(validated.data.id, validated.data);
        }
      }
    } catch {
      // Missing users file falls back to empty state.
    } finally {
      this.usersLoaded = true;
    }
  }

  private async persistUsers(): Promise<void> {
    const users = Array.from(this.users.values());
    const data = JSON.stringify(users, null, 2);
    this.userWriteQueue = this.enqueueWrite(this.userWriteQueue, this.usersFilePath, data);
    await this.userWriteQueue;
  }

  private async ensureTemplatesLoaded(): Promise<void> {
    if (this.templatesLoaded) {
      return;
    }

    try {
      const fileContent = await readFile(this.templatesFilePath, "utf8");
      const parsed = JSON.parse(fileContent);
      const templates = Array.isArray(parsed) ? parsed : [];

      for (const template of templates) {
        const validated = invoiceTemplateSchema.safeParse(template);
        if (validated.success) {
          this.invoiceTemplates.set(validated.data.id, validated.data);
        }
      }
    } catch {
      // Missing template file falls back to empty state.
    } finally {
      this.templatesLoaded = true;
    }
  }

  private async persistTemplates(): Promise<void> {
    const templates = Array.from(this.invoiceTemplates.values());
    const data = JSON.stringify(templates, null, 2);
    this.templateWriteQueue = this.enqueueWrite(this.templateWriteQueue, this.templatesFilePath, data);
    await this.templateWriteQueue;
  }

  private async ensureInvoicesLoaded(): Promise<void> {
    if (this.invoicesLoaded) {
      return;
    }

    try {
      const fileContent = await readFile(this.invoicesFilePath, "utf8");
      const parsed = JSON.parse(fileContent);
      const invoices = Array.isArray(parsed) ? parsed : [];

      for (const invoice of invoices) {
        const validated = invoiceSchema.safeParse(invoice);
        if (validated.success) {
          this.invoices.set(validated.data.id, validated.data);
        }
      }
    } catch {
      // Missing invoice file falls back to empty state.
    } finally {
      this.invoicesLoaded = true;
    }
  }

  private async persistInvoices(): Promise<void> {
    const invoices = Array.from(this.invoices.values());
    const data = JSON.stringify(invoices, null, 2);
    this.invoiceWriteQueue = this.enqueueWrite(this.invoiceWriteQueue, this.invoicesFilePath, data);
    await this.invoiceWriteQueue;
  }

  private async migrateLegacyTemplates(defaultUserId: string): Promise<boolean> {
    let migrated = false;

    try {
      const fileContent = await readFile(this.templatesFilePath, "utf8");
      const parsed = JSON.parse(fileContent);
      const templates = Array.isArray(parsed) ? parsed : [];

      for (const template of templates) {
        if (!template || typeof template !== "object") {
          continue;
        }

        const maybeTemplate = template as Record<string, unknown>;
        if (typeof maybeTemplate.userId === "string") {
          continue;
        }

        const withUserId = { ...maybeTemplate, userId: defaultUserId };
        const validated = invoiceTemplateSchema.safeParse(withUserId);
        if (validated.success) {
          this.invoiceTemplates.set(validated.data.id, validated.data);
          migrated = true;
        }
      }
    } catch {
      return false;
    }

    return migrated;
  }

  private async migrateLegacyInvoices(defaultUserId: string): Promise<boolean> {
    let migrated = false;

    try {
      const fileContent = await readFile(this.invoicesFilePath, "utf8");
      const parsed = JSON.parse(fileContent);
      const invoices = Array.isArray(parsed) ? parsed : [];

      for (const invoice of invoices) {
        if (!invoice || typeof invoice !== "object") {
          continue;
        }

        const maybeInvoice = invoice as Record<string, unknown>;
        if (typeof maybeInvoice.userId === "string") {
          continue;
        }

        const withUserId = { ...maybeInvoice, userId: defaultUserId };
        const validated = invoiceSchema.safeParse(withUserId);
        if (validated.success) {
          this.invoices.set(validated.data.id, validated.data);
          migrated = true;
        }
      }
    } catch {
      return false;
    }

    return migrated;
  }

  private async ensureBootstrapped(): Promise<void> {
    if (this.bootstrapPromise) {
      await this.bootstrapPromise;
      return;
    }

    this.bootstrapPromise = (async () => {
      await this.ensureUsersLoaded();
      await this.ensureTemplatesLoaded();
      await this.ensureInvoicesLoaded();

      let defaultUser = Array.from(this.users.values()).find(
        (user) => user.email === DEFAULT_ACCOUNT.email,
      );

      if (!defaultUser) {
        defaultUser = {
          id: randomUUID(),
          name: DEFAULT_ACCOUNT.name,
          email: DEFAULT_ACCOUNT.email,
          passwordHash: hashPassword(DEFAULT_ACCOUNT.password),
          createdAt: new Date().toISOString(),
        };
        this.users.set(defaultUser.id, defaultUser);
        await this.persistUsers();
      }

      const migratedTemplates = await this.migrateLegacyTemplates(defaultUser.id);
      const migratedInvoices = await this.migrateLegacyInvoices(defaultUser.id);

      if (migratedTemplates) {
        await this.persistTemplates();
      }

      if (migratedInvoices) {
        await this.persistInvoices();
      }
    })();

    await this.bootstrapPromise;
  }

  async getUser(id: string): Promise<User | undefined> {
    await this.ensureBootstrapped();
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    await this.ensureBootstrapped();
    const normalizedEmail = email.trim().toLowerCase();
    return Array.from(this.users.values()).find((user) => user.email === normalizedEmail);
  }

  async createUser(input: SignupInput): Promise<User> {
    await this.ensureBootstrapped();

    const email = input.email.trim().toLowerCase();
    const existing = await this.getUserByEmail(email);
    if (existing) {
      throw Object.assign(new Error("An account with this email already exists"), {
        status: 400,
      });
    }

    const user: User = {
      id: randomUUID(),
      name: input.name.trim(),
      email,
      passwordHash: hashPassword(input.password),
      createdAt: new Date().toISOString(),
    };

    this.users.set(user.id, user);
    await this.persistUsers();
    return user;
  }

  async listInvoiceTemplates(userId: string): Promise<InvoiceTemplate[]> {
    await this.ensureBootstrapped();
    return Array.from(this.invoiceTemplates.values())
      .filter((template) => template.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async createInvoiceTemplate(userId: string, insertTemplate: InsertInvoiceTemplate): Promise<InvoiceTemplate> {
    await this.ensureBootstrapped();

    const template: InvoiceTemplate = {
      id: randomUUID(),
      userId,
      name: insertTemplate.name,
      data: insertTemplate.data,
      createdAt: new Date().toISOString(),
    };

    this.invoiceTemplates.set(template.id, template);
    await this.persistTemplates();
    return template;
  }

  async listInvoices(userId: string): Promise<Invoice[]> {
    await this.ensureBootstrapped();
    return Array.from(this.invoices.values())
      .filter((invoice) => invoice.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async createInvoice(userId: string, insertInvoice: InsertInvoice): Promise<Invoice> {
    await this.ensureBootstrapped();

    const invoice: Invoice = {
      id: randomUUID(),
      userId,
      createdAt: new Date().toISOString(),
      ...insertInvoice,
    };

    this.invoices.set(invoice.id, invoice);
    await this.persistInvoices();
    return invoice;
  }

  async updateInvoice(userId: string, id: string, updateInvoice: UpdateInvoice): Promise<Invoice | undefined> {
    await this.ensureBootstrapped();
    const existing = this.invoices.get(id);
    if (!existing || existing.userId !== userId) {
      return undefined;
    }

    const updated: Invoice = {
      ...existing,
      ...updateInvoice,
      userId: existing.userId,
      id: existing.id,
      createdAt: existing.createdAt,
    };

    this.invoices.set(id, updated);
    await this.persistInvoices();
    return updated;
  }

  async updateInvoiceStatus(userId: string, id: string, status: InvoiceStatus): Promise<Invoice | undefined> {
    await this.ensureBootstrapped();
    const existing = this.invoices.get(id);
    if (!existing || existing.userId !== userId) {
      return undefined;
    }

    const updated: Invoice = {
      ...existing,
      status,
    };

    this.invoices.set(id, updated);
    await this.persistInvoices();
    return updated;
  }
}

export const storage = new MemStorage();
