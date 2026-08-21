FROM ollama/ollama:latest
ENV OLLAMA_HOST=0.0.0.0:11434
ENV OLLAMA_MODELS=/root/.ollama/models
EXPOSE 11434
CMD ["sh", "-c", "ollama serve & sleep 3 && ollama pull phi3 && wait"]
