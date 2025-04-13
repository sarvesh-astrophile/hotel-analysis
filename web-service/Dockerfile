# Dockerfile

# ---- Dependencies ----
FROM oven/bun:1 as deps
WORKDIR /app

# Copy package manager files and tsconfig
COPY package.json bun.lockb tsconfig.json ./
# Install dependencies using Bun
RUN bun install --frozen-lockfile

# ---- Builder ----
FROM oven/bun:1 as builder
WORKDIR /app

# Copy dependencies from the previous stage
COPY --from=deps /app/node_modules ./node_modules
# Copy all necessary project files
COPY package.json bun.lockb tsconfig.json next.config.js postcss.config.js components.json ./
COPY public ./public
COPY src ./src

# Ensure environment variables are available if needed during build, though typically read at runtime
# You might need to pass build arguments for specific env vars if they affect the build process
# e.g., ARG NEXT_PUBLIC_BACKEND_URL
# ENV NEXT_PUBLIC_BACKEND_URL=$NEXT_PUBLIC_BACKEND_URL

# Build the Next.js application
# Using --debug might provide more insight if the build fails
RUN bun run build

# ---- Runner ----
FROM oven/bun:1 as runner
WORKDIR /app

# Set environment to production
ENV NODE_ENV=production
# Set default port
ENV PORT=3000

# Create a non-root user for security
RUN groupadd --system --gid 1001 nextjs
RUN useradd --system --uid 1001 --gid nextjs nextjs

# Copy standalone output, public folder, and static assets from the builder stage
COPY --from=builder --chown=nextjs:nextjs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nextjs /app/public ./public
COPY --from=builder --chown=nextjs:nextjs /app/.next/static ./.next/static

# Switch to the non-root user
USER nextjs

# Expose the application port
EXPOSE 3000

# Command to run the application
# The standalone output creates a server.js file
CMD ["bun", "./server.js"] 