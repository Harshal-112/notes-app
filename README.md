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
│   └── front_service.yaml
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

1. Build and push images (or load directly into `kind` for local testing):
   ```bash
   docker build -t <your-dockerhub-username>/notes-app_backend ./backend
   docker build -t <your-dockerhub-username>/notes-app_frontend ./frontend

   kind load docker-image <your-dockerhub-username>/notes-app_backend --name <cluster-name>
   kind load docker-image <your-dockerhub-username>/notes-app_frontend --name <cluster-name>
   ```

2. Apply the manifests:
   ```bash
   cd kubernetes
   kubectl apply -f namespace.yaml
   kubectl apply -f back_deployment.yaml
   kubectl apply -f back_service.yaml
   kubectl apply -f front_deployment.yaml
   kubectl apply -f front_service.yaml
   ```

3. Check pod status:
   ```bash
   kubectl get pods -n notes-app-ns
   ```

4. Since services are `ClusterIP` (internal-only), port-forward to access them locally:
   ```bash
   kubectl port-forward -n notes-app-ns svc/notes-app-backend-service 8000:8000
   kubectl port-forward -n notes-app-ns svc/notes-app-frontend-service 5173:5173
   ```

5. Visit `http://localhost:5173/`

> **Note:** This currently requires two separate port-forwards since the frontend calls the backend directly at `http://127.0.0.1:8000`. An Ingress controller (routing both services through a single entry point) is a planned next step.

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
- Debugging real infrastructure issues end-to-end: build context mismatches, Python module path resolution, missing migrations, and WSL2/Node environment quirks

## Roadmap

- [ ] Add Ingress for single-entrypoint routing (eliminate dual port-forwarding)
- [ ] CI/CD pipeline via GitHub Actions
- [ ] Move from SQLite to PostgreSQL for production-readiness
- [ ] Persistent Volume Claims for stateful storage in Kubernetes
- [ ] Terraform for infrastructure provisioning
