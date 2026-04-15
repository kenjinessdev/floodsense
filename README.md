# 🌊 Davao FloodSense: Ensemble Risk Mapper

A web-based flood susceptibility mapping application for Davao City, Mindanao, Philippines. Uses ensemble machine learning (Random Forest + XGBoost) to assess flood risk based on terrain and environmental factors.

## 🎯 Features

- **Interactive Map Interface**: OpenStreetMap-based selection within Davao City bounds
- **Ensemble ML Model**: Combines Random Forest and XGBoost for superior accuracy (AUC 0.87+)
- **8 Conditioning Factors**: Elevation, Slope, Aspect, Curvature, Distance to River, Rainfall, Land Use, Lithology
- **Risk Assessment**: Visual gauge showing Low/Moderate/High/Very High susceptibility
- **Factor Analysis**: Detailed breakdown of why a location has specific risk level
- **Responsive Design**: Works on desktop and mobile devices

## 🏗️ Tech Stack

- **TypeScript** - Type safety and improved developer experience
- **React 18** - Modern frontend framework
- **TanStack Router** - File-based routing with full type safety
- **TailwindCSS** - Utility-first CSS for rapid UI development
- **Leaflet** - Interactive maps with OpenStreetMap
- **Turborepo** - Optimized monorepo build system

## 🚀 Getting Started

First, install the dependencies:

```bash
pnpm install
```

Then, run the development server:

```bash
pnpm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser to see the web application.

## 📖 How to Use

1. **Select Location**: Click anywhere on the map within Davao City (blue boundary) or use "My Location" button
2. **Analyze**: Click "Analyze Location" to run the ensemble model
3. **View Results**: See risk gauge, factor breakdown, and recommendations
4. **Learn More**: Click "About" to understand the technology and methodology

## 📁 Project Structure

```
floodsense/
├── apps/
│   └── web/         # Frontend application (React + TanStack Router)
├── packages/
│   ├── config/      # Shared TypeScript configs
│   └── env/         # Environment variable handling
```

## 🔬 Machine Learning Models

### `GeoFactor` - Factor Extraction

Extracts eight conditioning factors: Elevation, Slope, Aspect, Profile Curvature, Distance to River, Rainfall, Land Use, Lithology

### `RandomForestModel` - Bagging Ensemble

- 100 decision trees with majority voting
- Provides stability and robustness
- Accuracy: AUC 0.85

### `XGBoostModel` - Gradient Boosting

- 50 sequential error correction rounds
- Provides precision and accuracy
- Accuracy: AUC 0.86

### `EnsemblePredictor` - Stacking

- Combines RF (45%) and XGBoost (55%)
- Superior accuracy: AUC 0.87+
- Outputs probability, risk level, confidence

## 📜 Available Scripts

- `pnpm run dev`: Start all applications in development mode
- `pnpm run build`: Build all applications for production
- `pnpm run dev:web`: Start only the web application
- `pnpm run dev:server`: Start only the API server
- `pnpm run check-types`: Check TypeScript types across all apps

## ⚠️ Important Disclaimers

- **NOT Real-Time Forecasting**: This tool provides susceptibility mapping using offline data
- **Planning Tool**: For risk assessment and planning, not emergency response
- **Davao City Only**: Analysis limited to geographical bounds of Davao City
- **Academic Prototype**: Demonstration with synthetic training data for educational purposes

## 🎓 Academic Context

Based on research studying flash floods in Davao City caused by complex terrain and upstream rainfall patterns. Known flood-prone areas include Matina Pangi, Talomo, and Buhangin.

---

**Davao FloodSense** © 2026 • Built for flood risk awareness

- `cd apps/web && pnpm run generate-pwa-assets`: Generate PWA assets
