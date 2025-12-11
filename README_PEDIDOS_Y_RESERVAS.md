# Propuesta de Estados de Pedidos y Gestión de Reservas

## Estados de los Pedidos

1. **pending**: Pedido creado, esperando confirmación.
2. **confirmed**: Pedido confirmado, stock reservado.
3. **paid**: Pedido pagado.
4. **shipped**: Pedido enviado.
5. **delivered**: Pedido entregado.
6. **cancelled**: Pedido cancelado.

## Gestión de Registros de Reserva de Stock

- Cuando el pedido pasa a **confirmed**, se crea o actualiza el registro de reserva de stock.
- Si el pedido se cancela (**cancelled**), el stock reservado debe liberarse (el registro de reserva se elimina o se marca como liberado).
- Si el pedido se paga (**paid**) y se envía (**shipped**), el stock reservado se descuenta definitivamente.

## Sugerencias para la Implementación

- Usar funciones backend para actualizar el estado del pedido y la reserva de stock de forma transaccional.
- Mantener un historial de cambios de estado para auditoría.
- Permitir al administrador listar y gestionar pedidos por estado.

---

> Este README resume la propuesta para la gestión de estados de pedidos y reservas de stock. Útil para la siguiente versión del sistema.
