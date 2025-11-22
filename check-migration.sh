#!/bin/bash
echo "zxc" | sudo -S docker exec damdiqr_mysql mysql -udamdi_user -pdamdi_password damdi_qr -e "DESCRIBE restaurants;" 2>&1 | grep "whatsapp_number" || echo "Поле whatsapp_number не найдено"

