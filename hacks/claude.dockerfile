FROM debian:13.3-slim

ARG TARGETARCH
ARG DEBIAN_FRONTEND=noninteractive

ARG NODE_VERSION=v24.19.0
ARG JQ_VERSION=jq-1.8.2
ARG YQ_VERSION=v4.53.3
ARG CLAUDE_VERSION=2.1.231
ARG DOCKER_CLI_VERSION=29.7.2
ARG BUILDX_VERSION=v0.36.1
ARG RG_VERSION=15.2.0
ARG GH_VERSION=2.97.0
ARG DELTA_VERSION=0.19.2
ARG FZF_VERSION=0.74.2

ENV PATH="/root/.local/bin:/usr/local/go/bin:/root/go/bin:${PATH}"
ENV IS_SANDBOX=1
ENV DISABLE_UPDATES=1
ENV TZ=Etc/UTC

VOLUME /root/.claude/
WORKDIR /opt/project

# This RUN installs the toolchain
RUN echo "" \
 && apt-get -qq update && apt-get -qq upgrade  \
 && apt-get -qq install --no-install-recommends -y curl wget ca-certificates git openssh-client unzip python3 python3-pip procps tree vim tzdata gcc libc6-dev\
 && apt-get -qq clean  \
 && rm -rf /var/lib/apt/lists/* \
 && echo '\
{\n\
  "hasCompletedOnboarding": true,\n\
  "projects": {\n\
    "/opt/project": {\n\
      "hasTrustDialogAccepted": true,\n\
      "hasCompletedProjectOnboarding": true\n\
    }\n\
  },\n\
  "effortCalloutDismissed": true\n\
}\n\
' > /root/.claude.json \
 && curl -fsSL -o /tmp/docker.tgz https://download.docker.com/linux/static/stable/$(echo "$TARGETARCH" | sed -e 's/amd64/x86_64/' -e 's/arm64/aarch64/')/docker-${DOCKER_CLI_VERSION}.tgz \
 && tar -xzf /tmp/docker.tgz -C /usr/local/bin --strip-components=1 docker/docker \
 && rm -f /tmp/docker.tgz \
 && curl -fsSL --create-dirs -o /usr/local/lib/docker/cli-plugins/docker-buildx https://github.com/docker/buildx/releases/download/${BUILDX_VERSION}/buildx-${BUILDX_VERSION}.linux-${TARGETARCH} \
 && chmod +x /usr/local/lib/docker/cli-plugins/docker-buildx \
 && curl -fsSL -o /usr/local/bin/yq https://github.com/mikefarah/yq/releases/download/${YQ_VERSION}/yq_linux_${TARGETARCH} \
 && chmod +x /usr/local/bin/yq \
 && curl -fsSL -o /usr/local/bin/jq https://github.com/jqlang/jq/releases/download/${JQ_VERSION}/jq-linux-${TARGETARCH} \
 && chmod +x /usr/local/bin/jq \
 && curl -fsSL -o /tmp/rg.tgz https://github.com/BurntSushi/ripgrep/releases/download/${RG_VERSION}/ripgrep-${RG_VERSION}-$(echo "$TARGETARCH" | sed -e 's/amd64/x86_64-unknown-linux-musl/' -e 's/arm64/aarch64-unknown-linux-gnu/').tar.gz \
 && tar -xzf /tmp/rg.tgz -C /usr/local/bin --strip-components=1 ripgrep-${RG_VERSION}-$(echo "$TARGETARCH" | sed -e 's/amd64/x86_64-unknown-linux-musl/' -e 's/arm64/aarch64-unknown-linux-gnu/')/rg \
 && rm -f /tmp/rg.tgz \
 && curl -fsSL -o /tmp/gh.tgz https://github.com/cli/cli/releases/download/v${GH_VERSION}/gh_${GH_VERSION}_linux_${TARGETARCH}.tar.gz \
 && tar -xzf /tmp/gh.tgz -C /usr/local/bin --strip-components=2 gh_${GH_VERSION}_linux_${TARGETARCH}/bin/gh \
 && rm -f /tmp/gh.tgz \
 && curl -fsSL -o /tmp/delta.tgz https://github.com/dandavison/delta/releases/download/${DELTA_VERSION}/delta-${DELTA_VERSION}-$(echo "$TARGETARCH" | sed -e 's/amd64/x86_64-unknown-linux-musl/' -e 's/arm64/aarch64-unknown-linux-gnu/').tar.gz \
 && tar -xzf /tmp/delta.tgz -C /usr/local/bin --strip-components=1 delta-${DELTA_VERSION}-$(echo "$TARGETARCH" | sed -e 's/amd64/x86_64-unknown-linux-musl/' -e 's/arm64/aarch64-unknown-linux-gnu/')/delta \
 && rm -f /tmp/delta.tgz \
 && curl -fsSL -o /tmp/fzf.tgz https://github.com/junegunn/fzf/releases/download/v${FZF_VERSION}/fzf-${FZF_VERSION}-linux_${TARGETARCH}.tar.gz \
 && tar -xzf /tmp/fzf.tgz -C /usr/local/bin fzf \
 && rm -f /tmp/fzf.tgz \
 && curl -fsSL -o /tmp/node.tar.gz https://nodejs.org/dist/${NODE_VERSION}/node-${NODE_VERSION}-linux-$(echo "$TARGETARCH" | sed -e 's/amd64/x64/').tar.gz \
 && tar -xzf /tmp/node.tar.gz -C /usr/local --strip-components=1 \
 && rm -f /tmp/node.tar.gz /usr/local/CHANGELOG.md /usr/local/LICENSE /usr/local/README.md \
 && printf '%s\n' \
      '#!/bin/sh' \
      'exec claude "$@"' \
      > /usr/local/bin/claude-entrypoint \
 && chmod +x /usr/local/bin/claude-entrypoint \
 && curl -fsSL --create-dirs -o /root/.local/bin/claude https://downloads.claude.ai/claude-code-releases/${CLAUDE_VERSION}/linux-$(echo "$TARGETARCH" | sed 's/amd64/x64/')/claude \
 && chmod +x /root/.local/bin/claude

ENTRYPOINT ["/usr/local/bin/claude-entrypoint"]
