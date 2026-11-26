# Local lab only. Publish the port on 127.0.0.1 if you ever run a server.
# Verify the image tag exists before building (tag pinned to the tested Node).
FROM node:22.23.4-slim
WORKDIR /lab
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts
COPY . .
CMD ["sh", "scripts/compare.sh"]
