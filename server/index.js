import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import connectDB from "./config/db.js";
import swaggerDocs from "./config/swagger.js";
import urlsRouter from "./routes/urls.js";

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());

app.use("/api", urlsRouter);

swaggerDocs(app);

if (process.env.NODE_ENV !== "test") {
  connectDB();
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

export default app;
