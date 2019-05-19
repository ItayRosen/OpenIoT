FROM node:latest AS build

COPY platform /platform

WORKDIR /platform

RUN npm install \
  && npm run build

FROM nginx:1.16.0 AS prod

COPY --from=build /platform/build /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
