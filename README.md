# NoteVault

A full-stack notes application built with **Django REST Framework** and **React (Vite)**, containerized with Docker and deployable on **Kubernetes**. Built as a hands-on DevOps practice project covering containerization, multi-container orchestration, and Kubernetes fundamentals.

## Architecture

This project uses a **decoupled frontend/backend architecture** — the React SPA and the Django API run as independent, separately containerized services that communicate over HTTP, rather than a single monolithic server. This mirrors how modern production applications are typically structured.

```
notes-app/
├── backend/          # Django REST Framework API
│   ├── api/          # Notes & Categories app (models, views, serializers)
│   ├── backend/      # Django project settings
│   ├── manage.py
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/          # React + Vite SPA
│   ├── src/
│   ├── package.json
│   └── Dockerfile
├── kubernetes/         # K8s manifests for local (kind) deployment
│   ├── namespace.yaml
│   ├── back_deployment.yaml
│   ├── back_service.yaml
│   ├── front_deployment.yaml
│   ├── front_service.yaml
│   └── ingress.yaml
├── kind-config.yaml    # kind cluster config (enables Ingress port mapping)
├── docker-compose.yml # Local multi-container orchestration
└── .gitignore
```

## Tech Stack

| Layer          | Technology                          |
|----------------|--------------------------------------|
| Backend        | Django 6, Django REST Framework      |
| Frontend       | React, Vite                          |
| Database       | SQLite                               |
| Containers     | Docker, Docker Compose               |
| Orchestration  | Kubernetes (tested locally on `kind`)|
| Ingress        | NGINX Ingress Controller             |

## Running Locally with Docker Compose

The simplest way to run the full stack:

```bash
git clone https://github.com/Harshal-112/notes-app.git
cd notes-app
docker compose up --build
```

- Backend API: [http://localhost:8000/api/notes/](http://localhost:8000/api/notes/)
- Frontend UI: [http://localhost:5173/](http://localhost:5173/)

Database migrations run automatically on backend container startup. Notes persist across restarts via a bind-mounted volume.

To stop:
```bash
docker compose down
```

## Running on Kubernetes (local `kind` cluster)

1. Create the `kind` cluster using the provided config. This maps host ports 80/443 into the cluster and labels the node so the Ingress controller can schedule on it:
   ```bash
   kind create cluster --config kind-config.yaml
   ```

2. Install the NGINX Ingress Controller (kind-specific manifest):
   ```bash
   kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml
    ```

3. Build and load images into `kind` for local testing:
   ```bash
   docker build -t <your-dockerhub-username>/notes-app_backend ./backend
   docker build -t <your-dockerhub-username>/notes-app_frontend ./frontend

   kind load docker-image <your-dockerhub-username>/notes-app_backend --name <cluster-name>
   kind load docker-image <your-dockerhub-username>/notes-app_frontend --name <cluster-name>
   ```

4. Apply the manifests, including Ingress:
   ```bash
   cd kubernetes
   kubectl apply -f namespace.yaml
   kubectl apply -f back_deployment.yaml
   kubectl apply -f back_service.yaml
   kubectl apply -f front_deployment.yaml
   kubectl apply -f front_service.yaml
   kubectl apply -f ingress.yaml
   ```

5. Check pod and Ingress status:
   ```bash
   kubectl get pods -n notes-app-ns
   kubectl get ingress -n notes-app-ns
   ```

6. Visit the app — both frontend and backend are now reachable through a single entry point on port 80, no port-forwarding required:
   - Frontend UI: [http://localhost/](http://localhost/)
   - Backend API: [http://localhost/api/notes/](http://localhost/api/notes/)

   Ingress routes `/api/*` requests to the backend Service and everything else to the frontend Service, based on path. The frontend calls the API via a relative path (`/api/notes/`) rather than a hardcoded host, so both services resolve correctly through the same Ingress entry point.

## API Endpoints

| Method | Endpoint              | Description          |
|--------|------------------------|----------------------|
| GET    | `/api/notes/`           | List all notes       |
| POST   | `/api/notes/`           | Create a note        |
| DELETE | `/api/notes/<id>/`      | Delete a note         |
| GET    | `/api/categories/`      | List all categories   |

## What This Project Demonstrates

- Multi-stage Docker builds for both a Python/Django backend and a Node/React frontend
- Correct Docker build-context and `COPY` path handling
- Container-to-host networking and bind-mount volume persistence for SQLite
- Multi-container orchestration with Docker Compose
- Kubernetes fundamentals: Namespaces, Deployments, Services, and `ClusterIP` networking
- Ingress-based single-entrypoint routing with NGINX Ingress Controller, including path-based rules and `kind`-specific cluster networking (`extraPortMappings`, node labeling)

## Roadmap

- [ ] CI/CD pipeline via GitHub Actions
- [ ] Move from SQLite to PostgreSQL for production-readiness
- [ ] Persistent Volume Claims for stateful storage in Kubernetes
- [ ] Terraform for infrastructure provisioning
