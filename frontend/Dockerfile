FROM nginx:alpine

# Elimina configuración por defecto
RUN rm -rf /usr/share/nginx/html/* /etc/nginx/conf.d/default.conf

# Copia nuestra configuración
COPY nginx.conf /etc/nginx/conf.d/app.conf

# Copia archivos estáticos
COPY public/ /usr/share/nginx/html/

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
