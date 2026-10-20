# --- ETAP 1: Budowanie (Build) ---
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Kopiujemy pliki projektów (Restore)
COPY ["OneMoreSpin.Web/OneMoreSpin.Web.csproj", "OneMoreSpin.Web/"]
COPY ["OneMoreSpin.DAL/OneMoreSpin.DAL.csproj", "OneMoreSpin.DAL/"]
COPY ["OneMoreSpin.Model/OneMoreSpin.Model.csproj", "OneMoreSpin.Model/"]
COPY ["OneMoreSpin.Services/OneMoreSpin.Services.csproj", "OneMoreSpin.Services/"]
COPY ["OneMoreSpin.ViewModels/OneMoreSpin.ViewModels.csproj", "OneMoreSpin.ViewModels/"]

# Pobieramy zależności
RUN dotnet restore "OneMoreSpin.Web/OneMoreSpin.Web.csproj"

# Kopiujemy resztę plików
COPY . .

# Budujemy i publikujemy
WORKDIR "/src/OneMoreSpin.Web"
RUN dotnet publish "OneMoreSpin.Web.csproj" -c Release -o /app/publish

# --- ETAP 2: Uruchamianie (Runtime) ---
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
# The domain reverse proxy forwards requests to the container on this port.
ENV ASPNETCORE_HTTP_PORTS=7643
EXPOSE 7643
ENTRYPOINT ["dotnet", "OneMoreSpin.Web.dll"]