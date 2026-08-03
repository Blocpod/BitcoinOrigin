FROM node:22-alpine
WORKDIR /app
COPY . .
RUN node scripts/generate-demo.mjs && node scripts/export-single.mjs && node --test tests/*.test.mjs
ENV ORIGIN_HOST=0.0.0.0
ENV PORT=8787
EXPOSE 8787
CMD ["node", "server/index.mjs"]
