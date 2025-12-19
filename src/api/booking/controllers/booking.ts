/**
 * booking controller
 */

import { factories } from "@strapi/strapi";

export default factories.createCoreController(
  "api::booking.booking",
  ({ strapi }) => ({
    async createWithCustomer(ctx) {
      const { data } = ctx.request.body;
      // console.log("data:", data);

      const {
        customerName,
        customerPhone,
        customerEmail,
        bookingDate,
        bookingTime,
        bookingNote,
        employeeId,
        serviceId,
      } = data;
      try {
        let customer = await strapi
          .documents("api::customer.customer")
          .findFirst({
            filters: { customer_phone: customerPhone },
            status: "published",
          });
        if (!customer) {
          console.log("Customer not found, creating new one...");
          customer = await strapi.documents("api::customer.customer").create({
            data: {
              customer_name: customerName,
              customer_phone: customerPhone,
              customer_email: customerEmail,
            },
            status: "published",
          });
        }
        // console.log("customer: ", customer);

        const services = await strapi
          .documents("api::service.service")
          .findMany({
            filters: {
              documentId: {
                $in: serviceId,
              },
            },
          });
        // console.log("Services:", services);

        if (!services || services.length === 0) {
          return ctx.badRequest("Service not found!");
        }

        // Cộng dồn tất cả working_time (phút)
        const totalWorkingTime = services.reduce((total, s) => {
          return total + (Number(s.working_time) || 0);
        }, 0);

        // 3. Tính toán booking_end
        const startTime = new Date(`${bookingDate}T${bookingTime}`);
        const endTime = new Date(
          startTime.getTime() + totalWorkingTime * 60000
        );

        // Chuyển định dạng về HH:mm:ss
        const bookingEnd = endTime.toTimeString().split(" ")[0];
        // console.log("Booking end time:", bookingEnd);
        let bookingCode = "";
        let isUnique = false;

        while (!isUnique) {
          const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
          let randomPart = "";
          for (let i = 0; i < 6; i++) {
            randomPart += characters.charAt(
              Math.floor(Math.random() * characters.length)
            );
          }
          bookingCode = `BK-${randomPart}`;
          //check trùng
          const existingBooking = await strapi
            .documents("api::booking.booking")
            .findFirst({
              filters: { booking_code: bookingCode },
            });

          if (!existingBooking) {
            isUnique = true;
          }
        }
        const newBooking = await strapi
          .documents("api::booking.booking")
          .create({
            data: {
              name: customer.customer_name,
              email: customer.customer_email,
              phone: customer.customer_phone,
              booking_date: bookingDate,
              booking_time: bookingTime,
              booking_end: bookingEnd,
              note: bookingNote || "",
              customer: customer.documentId,
              booking_status: "waiting_approve",
              employee: employeeId,
              services: serviceId,
              booking_code: bookingCode,
            },
            status: "published",
          });
        // console.log("New Booking:", newBooking);

        return ctx.send({
          message: "Booking created successfully !",
          booking: newBooking,
        });
      } catch (err) {
        console.error("Error creating booking:", err);
        return ctx.internalServerError(`Create booking failed: ${err.message}`);
      }
    },
  })
);
