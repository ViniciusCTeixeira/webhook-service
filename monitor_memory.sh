#!/bin/bash

# Define o limite de memória em MB (15GB = 15360MB)
LIMIT_MB=15360

# Redireciona a saída para um log
LOG_FILE="/root/wa-service/logs/monitor_memory.log"
echo "$(date) - Monitor de memória iniciado." | tee -a "$LOG_FILE"

while true; do
    # Obtém a memória usada em MB
    MEM_USED=$(free -m | awk '/^Mem:/ {print $3}')

    # Verifica se o uso de memória ultrapassa o limite
    if [[ "$MEM_USED" -gt "$LIMIT_MB" ]]; then
        echo "$(date) - Memória excedida ($MEM_USED MB), reiniciando..." | tee -a "$LOG_FILE"
        sudo reboot
    fi

    sleep 30  # Aguarda 30 segundos antes de verificar novamente
done
