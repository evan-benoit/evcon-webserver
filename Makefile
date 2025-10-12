GIT_SHA := $(shell git rev-parse --short HEAD)

build:
	docker build --platform linux/amd64 -t webserver .
	docker tag webserver us-east1-docker.pkg.dev/evcon-app/my-repository/webserver:$(GIT_SHA)
	docker tag webserver us-east1-docker.pkg.dev/evcon-app/my-repository/webserver:latest


push:
	docker push us-east1-docker.pkg.dev/evcon-app/my-repository/webserver:$(GIT_SHA)
	docker push us-east1-docker.pkg.dev/evcon-app/my-repository/webserver:latest




# docker build --platform linux/amd64 -t webserver . && \
# docker tag webserver us-east1-docker.pkg.dev/evcon-app/my-repository/webserver:latest && \
# docker push us-east1-docker.pkg.dev/evcon-app/my-repository/webserver:latest