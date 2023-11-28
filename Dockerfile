#Build fragments microservice

# Stage 0: Install the dependencies

# Parent (or base) image to use as a starting point for our own image
# Use node version 18.13.0 with `:tag`
FROM node:18.18.0 AS dependencies

# key=value pairs with arbitrary metadata about your image
LABEL maintainer="Mirim Kim <mirimkim00@gmail.com>"
LABEL description="Fragments node.js microservice"

# Use /app as our working directory
WORKDIR /app

# copy your application's files into the image
COPY package*.json /app/

# Install node dependencies defined in package-lock.json
RUN npm install

# Copy src to /app/src/
COPY ./src ./src

# Copy our HTPASSWD file
COPY ./tests/.htpasswd ./tests/.htpasswd

#######################################################################

# Stage 1: use dependencies to build and run

FROM node:18.18.0 AS builder

# Where to put the env?
# Those are all fine to have in any layer of your image,
# but for sure you want to have the PORT and NODE_ENV in final layer.
# They can be overriden at run time, so there is no risk in having them.

# We default to use port 8080 in our service
ENV PORT=8080

# all installation steps and code execution occur in a production way
ENV NODE_ENV=production

# Reduce npm spam when installing within Docker
# https://docs.npmjs.com/cli/v8/using-npm/config#loglevel
ENV NPM_CONFIG_LOGLEVEL=warn

# Disable colour when run inside Docker
# https://docs.npmjs.com/cli/v8/using-npm/config#color
ENV NPM_CONFIG_COLOR=false

WORKDIR /app

# Copy cached dependencies from previous stage so we don't have to download
COPY --from=dependencies /app /app

# Copy source code into the image
COPY . .

# Run the server
# Start the container by running our server
CMD ["npm", "start"]

# We run our service on port 8080
EXPOSE 8080

# exit 0 or 1(fail)
# HEALTHCHECK --interval=15s --timeout=30s --start-period=5s --retries=3 \
#   CMD curl --fail localhost:8080 || exit 1
 