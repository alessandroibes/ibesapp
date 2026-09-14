FROM node:22-alpine AS web
WORKDIR /repo/apps/web
COPY apps/web/package*.json ./
RUN npm ci
COPY apps/web/ ./
COPY packages/contracts/ /repo/packages/contracts/
RUN npm run build

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /repo
COPY global.json Directory.Build.props Ibes.slnx ./
COPY src/ src/
RUN dotnet restore src/Ibes.Api/Ibes.Api.csproj --locked-mode
RUN dotnet publish src/Ibes.Api/Ibes.Api.csproj -c Release --no-restore -o /publish

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /publish .
COPY --from=web /repo/apps/web/dist ./wwwroot
RUN mkdir -p /home/app/.aspnet/DataProtection-Keys && chown -R app:app /home/app/.aspnet
USER $APP_UID
EXPOSE 8080 8443
ENTRYPOINT ["dotnet", "Ibes.Api.dll"]
