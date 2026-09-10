# Build stage
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build

WORKDIR /src

COPY InventoryApi.csproj ./

RUN dotnet restore

COPY . .

RUN dotnet publish InventoryApi.csproj \
    -c Release \
    -o /app/publish \
    --no-restore


# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final

WORKDIR /app

ENV ASPNETCORE_URLS=http://+:10000

COPY --from=build /app/publish .

EXPOSE 10000

ENTRYPOINT ["dotnet", "InventoryApi.dll"]