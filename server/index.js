import { prisma } from "./lib/prisma.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { verifyAdmin } from "./middleware/auth.js";
import "dotenv/config";
import express from "express";
import cors from "cors";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client";
import { randomUUID } from "node:crypto";
import cloudinary from "./lib/cloudinary.js";
import upload from "./middleware/upload.js";

const app = express();

app.use(cors());
app.use(express.json());


// Home route
app.get("/", (req, res) => {
  res.send("Aklima Fashion House API is running!");
});

// Get public store settings
app.get("/api/store-settings", async (req, res) => {
  try {
    const settings = await prisma.storeSettings.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        storeName: "Aklima Fashion House",
      },
    });

    res.json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error("Store settings fetch error:", error);

    res.status(500).json({
      success: false,
      message: "Could not load store settings.",
    });
  }
});

// Update store settings (Admin only)
app.put("/api/admin/store-settings", verifyAdmin, async (req, res) => {
  try {
    const { storeName, logoUrl, logoPublicId } = req.body;

    if (typeof storeName !== "string" || !storeName.trim()) {
      return res.status(400).json({
        success: false,
        message: "Store name is required.",
      });
    }

    if (
      logoUrl !== undefined &&
      logoUrl !== null &&
      typeof logoUrl !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid logo URL.",
      });
    }

    if (
      logoPublicId !== undefined &&
      logoPublicId !== null &&
      typeof logoPublicId !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid logo public ID.",
      });
    }

    const settings = await prisma.storeSettings.upsert({
      where: { id: 1 },
      update: {
        storeName: storeName.trim(),
        ...(logoUrl !== undefined ? { logoUrl } : {}),
        ...(logoPublicId !== undefined ? { logoPublicId } : {}),
      },
      create: {
        id: 1,
        storeName: storeName.trim(),
        logoUrl: logoUrl ?? null,
        logoPublicId: logoPublicId ?? null,
      },
    });

    res.json({
      success: true,
      message: "Store settings updated successfully!",
      settings,
    });
  } catch (error) {
    console.error("Store settings update error:", error);

    res.status(500).json({
      success: false,
      message: "Could not update store settings.",
    });
  }
});

// Health check
app.get("/api/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      success: true,
      message: "Backend and Database are connected!",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Database connection failed",
    });
  }
});

// Get all active products from PostgreSQL
app.get("/api/products", async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error("Product fetch error:", error);

    res.status(500).json({
      success: false,
      message: "Could not fetch products",
    });
  }
});

// Get one product by ID
app.get("/api/products/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product || !product.isActive) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.json({
      success: true,
      product,
    });
  } catch (error) {
    console.error("Single product error:", error);

    res.status(500).json({
      success: false,
      message: "Could not fetch product",
    });
  }
});

const PORT = process.env.PORT || 5000;
// Admin Login
app.post("/api/admin/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const admin = await prisma.admin.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      admin.password
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      { adminId: admin.id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      success: true,
      message: "Admin login successful",
      token,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
      },
    });
  } catch (error) {
    console.error("Admin login error:", error);

    res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
});
// Protected Admin Profile
app.get("/api/admin/profile", verifyAdmin, (req, res) => {
  res.json({
    success: true,
    message: "You have access to the Admin Panel!",
    admin: req.admin,
  });
});
// Admin: Add a new product
app.post("/api/admin/products", verifyAdmin, async (req, res) => {
  try {
    const {
       slug,
  name,
  category,
  price,
  image,
  images = [],
  description,
  sizes,
  colors,
  stock,
    } = req.body;
const productImages = Array.isArray(images) && images.length
  ? images
  : image
    ? [image]
    : [];

    if (
      !slug ||
      !name ||
      !category ||
     productImages.length === 0 ||
!productImages.every(
  (url) => typeof url === "string" && url.trim()
) ||
      !description ||
      !Number.isInteger(price) ||
      price <= 0 ||
      !Array.isArray(sizes) ||
      !Array.isArray(colors)
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid product information.",
      });
    }

    if (
      (stock !== undefined &&
        (!Number.isInteger(stock) || stock < 0)) ||
      !sizes.every((item) => typeof item === "string") ||
      !colors.every((item) => typeof item === "string")
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid stock, sizes, or colors.",
      });
    }

    const product = await prisma.product.create({
      data: {
        slug: slug.trim().toLowerCase(),
        name: name.trim(),
        category: category.trim(),
        price,
      image: image?.trim() || productImages[0],
      images: productImages,
        description: description.trim(),
        sizes,
        colors,
        stock: stock ?? 0,
      },
    });

    res.status(201).json({
      success: true,
      message: "Product added successfully!",
      product,
    });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "A product with this slug already exists.",
      });
    }

    console.error("Add product error:", error);

    res.status(500).json({
      success: false,
      message: "Could not add product.",
    });
  }
});
// Admin: Update an existing product
app.put("/api/admin/products/:id", verifyAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID.",
      });
    }

    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct || !existingProduct.isActive) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    const allowedFields = [
    "slug",
  "name",
  "category",
  "price",
  "image",
  "images",
  "description",
  "sizes",
  "colors",
  "stock",
    ];

    const data = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        data[field] = req.body[field];
      }
    }

    for (const field of ["slug", "name", "category", "image", "description"]) {
      if (
        data[field] !== undefined &&
        (typeof data[field] !== "string" || !data[field].trim())
      ) {
        return res.status(400).json({
          success: false,
          message: `Invalid ${field}.`,
        });
      }
    }

    if (data.slug !== undefined) {
      data.slug = data.slug.trim().toLowerCase();
    }

    if (data.price !== undefined &&
        (!Number.isInteger(data.price) || data.price <= 0)) {
      return res.status(400).json({
        success: false,
        message: "Price must be a positive integer.",
      });
    }

    if (data.stock !== undefined &&
        (!Number.isInteger(data.stock) || data.stock < 0)) {
      return res.status(400).json({
        success: false,
        message: "Stock must be zero or a positive integer.",
      });
    }
if (
  data.images !== undefined &&
  (
    !Array.isArray(data.images) ||
    data.images.length === 0 ||
    !data.images.every(
      (url) => typeof url === "string" && url.trim()
    )
  )
) {
  return res.status(400).json({
    success: false,
    message: "Please provide valid product images.",
  });
}

if (data.images !== undefined && data.image === undefined) {
  data.image = data.images[0];
}
    for (const field of ["sizes", "colors"]) {
      if (
        data[field] !== undefined &&
        (!Array.isArray(data[field]) ||
          !data[field].every((item) => typeof item === "string"))
      ) {
        return res.status(400).json({
          success: false,
          message: `Invalid ${field}.`,
        });
      }
    }

    const product = await prisma.product.update({
      where: { id },
      data,
    });

    res.json({
      success: true,
      message: "Product updated successfully!",
      product,
    });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "This product slug is already in use.",
      });
    }

    console.error("Update product error:", error);

    res.status(500).json({
      success: false,
      message: "Could not update product.",
    });
  }
});
// Admin: Delete a product (soft delete)
app.delete("/api/admin/products/:id", verifyAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID.",
      });
    }

    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product || !product.isActive) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    await prisma.product.update({
      where: { id },
      data: { isActive: false },
    });

    res.json({
      success: true,
      message: "Product deleted successfully!",
    });
  } catch (error) {
    console.error("Delete product error:", error);

    res.status(500).json({
      success: false,
      message: "Could not delete product.",
    });
  }
});
// Admin: Get all active products
app.get("/api/admin/products", verifyAdmin, async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });

    res.json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error("Admin product fetch error:", error);

    res.status(500).json({
      success: false,
      message: "Could not load products.",
    });
  }
});
app.post("/api/orders", async (req, res) => {
  try {
    const {
      customerName,
      phone,
      district,
      address,
      deliveryZone,
      items,
    } = req.body;

    // Validate customer information
    if (
      !customerName?.trim() ||
      !/^01[0-9]{9}$/.test(phone || "") ||
      !district?.trim() ||
      !address?.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid customer information.",
      });
    }

    if (!["inside", "outside"].includes(deliveryZone)) {
      return res.status(400).json({
        success: false,
        message: "Invalid delivery zone.",
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Your cart is empty.",
      });
    }

    // Validate cart items
    for (const item of items) {
      if (
        !Number.isInteger(Number(item.productId)) ||
        !Number.isInteger(item.quantity) ||
        item.quantity < 1 ||
        !item.size ||
        !item.color
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid product information.",
        });
      }
    }

    const deliveryFee = deliveryZone === "inside" ? 70 : 120;

    const order = await prisma.$transaction(async (tx) => {
      let subtotal = 0;
      const orderItems = [];

      for (const item of items) {
        const product = await tx.product.findFirst({
          where: {
            id: Number(item.productId),
            isActive: true,
          },
        });

        if (!product) {
          throw new Error(`Product ${item.productId} is unavailable.`);
        }

        if (product.stock < item.quantity) {
          throw new Error(
            `Insufficient stock for ${product.name}. Available: ${product.stock}`
          );
        }

        if (
          !product.sizes.includes(item.size) ||
          !product.colors.includes(item.color)
        ) {
          throw new Error(`Invalid size or color for ${product.name}.`);
        }

        // Decrease stock only if enough stock remains
        const stockUpdate = await tx.product.updateMany({
          where: {
            id: product.id,
            stock: { gte: item.quantity },
          },
          data: {
            stock: { decrement: item.quantity },
          },
        });

        if (stockUpdate.count === 0) {
          throw new Error(`Insufficient stock for ${product.name}.`);
        }

        const lineTotal = product.price * item.quantity;
        subtotal += lineTotal;

        orderItems.push({
          productId: product.id,
          productName: product.name,
          unitPrice: product.price,
          size: item.size,
          color: item.color,
          quantity: item.quantity,
          lineTotal,
        });
      }

      const total = subtotal + deliveryFee;

      return await tx.order.create({
        data: {
          orderNumber: `AFH-${randomUUID().slice(0, 8).toUpperCase()}`,
          customerName: customerName.trim(),
          phone,
          district: district.trim(),
          address: address.trim(),
          deliveryZone,
          deliveryFee,
          subtotal,
          total,
          paymentMethod: "COD",
          status: "PENDING",
          items: {
            create: orderItems,
          },
        },
        include: {
          items: true,
        },
      });
    });

    return res.status(201).json({
      success: true,
      message: "Order placed successfully!",
      order,
    });

  } catch (error) {
    console.error("Order creation error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Could not place your order.",
    });
  }
});
app.get("/api/admin/orders", verifyAdmin, async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        items: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error("Admin orders fetch error:", error);

    res.status(500).json({
      success: false,
      message: "Could not load orders.",
    });
  }
});

app.patch("/api/admin/orders/:id/status", verifyAdmin, async (req, res) => {
  try {
    const orderId = Number(req.params.id);
    const { status } = req.body;

    const allowedStatuses = [
      "PENDING",
      "CONFIRMED",
      "SHIPPED",
      "DELIVERED",
      "CANCELLED",
    ];

    if (!Number.isInteger(orderId) || orderId < 1) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID.",
      });
    }

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status.",
      });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    if (order.status === "CANCELLED" && status !== "CANCELLED") {
      return res.status(400).json({
        success: false,
        message: "A cancelled order cannot be reopened.",
      });
    }

    const updatedOrder = await prisma.$transaction(async (tx) => {
      // Restore stock only when an order is cancelled for the first time.
      if (status === "CANCELLED" && order.status !== "CANCELLED") {
        const items = await tx.orderItem.findMany({
          where: { orderId },
        });

        for (const item of items) {
          if (item.productId !== null) {
            await tx.product.update({
              where: { id: item.productId },
              data: {
                stock: { increment: item.quantity },
              },
            });
          }
        }
      }

      return tx.order.update({
        where: { id: orderId },
        data: { status },
        include: { items: true },
      });
    });

    res.json({
      success: true,
      message: "Order status updated successfully.",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Order status update error:", error);

    res.status(500).json({
      success: false,
      message: "Could not update order status.",
    });
  }
});
app.get("/api/orders/:orderNumber", async (req, res) => {
  try {
    const { orderNumber } = req.params;
    const { phone } = req.query;

    if (!orderNumber || !phone) {
      return res.status(400).json({
        success: false,
        message: "Order ID and phone number are required.",
      });
    }

    const order = await prisma.order.findFirst({
      where: {
        orderNumber: orderNumber.trim(),
        phone: phone.trim(),
      },
      include: {
        items: true,
      },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "No order found. Please check your Order ID and phone number.",
      });
    }

    res.json({
      success: true,
      order,
    });

  } catch (error) {
    console.error("Order tracking error:", error);

    res.status(500).json({
      success: false,
      message: "Could not track your order.",
    });
  }
});

async function uploadToCloudinary(file, folder) {
  const base64Image = file.buffer.toString("base64");
  const dataUri = `data:${file.mimetype};base64,${base64Image}`;

  return cloudinary.uploader.upload(dataUri, {
    folder,
    resource_type: "image",
  });
}

// Upload multiple product images
app.post(
  "/api/admin/upload-images",
  verifyAdmin,
  upload.array("images", 10),
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Please select at least one image.",
        });
      }

      const results = await Promise.all(
        req.files.map((file) =>
          uploadToCloudinary(file, "aklima-fashion-house/products")
        )
      );

      const images = results.map((result) => ({
        url: result.secure_url,
        publicId: result.public_id,
      }));

      res.status(201).json({
        success: true,
        message: "Product images uploaded successfully.",
        images,
      });
    } catch (error) {
      console.error("Image upload error:", error);

      res.status(500).json({
        success: false,
        message: "Image upload failed.",
      });
    }
  }
);

// Upload store logo
app.post(
  "/api/admin/upload-logo",
  verifyAdmin,
  upload.single("image"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Please select a logo image.",
        });
      }

      const result = await uploadToCloudinary(
        req.file,
        "aklima-fashion-house/logo"
      );

      res.status(201).json({
        success: true,
        message: "Logo uploaded successfully.",
        logo: {
          url: result.secure_url,
          publicId: result.public_id,
        },
      });
    } catch (error) {
      console.error("Logo upload error:", error);

      res.status(500).json({
        success: false,
        message: "Logo upload failed.",
      });
    }
  }
);


app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
