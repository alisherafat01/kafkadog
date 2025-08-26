import { Controller, Post, Get, Param, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { CreateOrderRequestSchema } from '@kafkadog/contracts';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createOrder(@Body() createOrderDto: CreateOrderDto) {
    // Validate the request using the shared schema
    const validatedData = CreateOrderRequestSchema.parse(createOrderDto);
    
    const result = await this.ordersService.createOrder(validatedData);
    return result;
  }

  @Get(':id')
  async getOrder(@Param('id') id: string) {
    const order = await this.ordersService.getOrder(id);
    return order;
  }

  @Get()
  async getOrders() {
    const orders = await this.ordersService.getOrders();
    return orders;
  }
}

