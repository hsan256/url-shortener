import swaggerJsDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "URL Shortener API",
      version: "1.0.0",
      description: "API documentation for the URL Shortener service.",
    },
    servers: [
      {
        url: "https://deploy-backend-arcube.onrender.com/api",
      },
    ],
  },
  apis: ["./routes/*.js"],
};

const specs = swaggerJsDoc(options);

export default function setupSwagger(app) {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));
}