import nodemailer from 'nodemailer';

class EmailService {
  constructor() {
    this.transporter = null;
    this.initialized = false;
  }

  initialize() {
    if (this.initialized) return;

    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
      this.initialized = true;
    } else {
      console.log('Email service not configured - emails will be logged to console');
    }
  }

  async sendEmail({ to, subject, html, text }) {
    this.initialize();

    const mailOptions = {
      from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
      to,
      subject,
      html,
      text
    };

    if (this.transporter) {
      try {
        const info = await this.transporter.sendMail(mailOptions);
        console.log('Email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
      } catch (error) {
        console.error('Email error:', error);
        return { success: false, error: error.message };
      }
    } else {
      // Log email in development
      console.log('=== EMAIL (not sent - no SMTP configured) ===');
      console.log('To:', to);
      console.log('Subject:', subject);
      console.log('Body:', text || html);
      console.log('==============================================');
      return { success: true, logged: true };
    }
  }

  async sendWelcomeEmail(user) {
    return this.sendEmail({
      to: user.email,
      subject: 'Welcome to Tailor Connect!',
      html: `
        <h1>Welcome to Tailor Connect, ${user.firstName}!</h1>
        <p>Thank you for joining our platform. We're excited to have you.</p>
        ${user.role === 'tailor' ? `
          <p>As a tailor, you can now:</p>
          <ul>
            <li>Create your professional profile</li>
            <li>Upload your portfolio</li>
            <li>Set your availability</li>
            <li>Connect with customers worldwide</li>
          </ul>
          <p>Your profile is pending approval. We'll notify you once it's live!</p>
        ` : `
          <p>As a customer, you can now:</p>
          <ul>
            <li>Browse talented tailors</li>
            <li>View portfolios and reviews</li>
            <li>Book appointments</li>
            <li>Message tailors directly</li>
          </ul>
        `}
        <p>Best regards,<br>The Tailor Connect Team</p>
      `,
      text: `Welcome to Tailor Connect, ${user.firstName}!`
    });
  }

  async sendBookingConfirmation(booking, customer, tailor) {
    // Email to customer
    await this.sendEmail({
      to: customer.email,
      subject: 'Booking Confirmation - Tailor Connect',
      html: `
        <h1>Booking Confirmed!</h1>
        <p>Hi ${customer.firstName},</p>
        <p>Your booking with <strong>${tailor.businessName || tailor.username}</strong> has been submitted.</p>
        <p><strong>Date:</strong> ${new Date(booking.date).toLocaleDateString()}</p>
        <p><strong>Time:</strong> ${booking.startTime} - ${booking.endTime}</p>
        <p><strong>Service:</strong> ${booking.service}</p>
        <p>You'll be notified when the tailor responds to your booking.</p>
        <p>Best regards,<br>The Tailor Connect Team</p>
      `,
      text: `Booking confirmed with ${tailor.businessName || tailor.username}`
    });

    // Email to tailor
    const tailorUser = await this.getTailorUser(tailor.user);
    if (tailorUser) {
      await this.sendEmail({
        to: tailorUser.email,
        subject: 'New Booking Request - Tailor Connect',
        html: `
          <h1>New Booking Request!</h1>
          <p>Hi ${tailorUser.firstName},</p>
          <p>You have a new booking request from <strong>${customer.firstName} ${customer.lastName}</strong>.</p>
          <p><strong>Date:</strong> ${new Date(booking.date).toLocaleDateString()}</p>
          <p><strong>Time:</strong> ${booking.startTime} - ${booking.endTime}</p>
          <p><strong>Service:</strong> ${booking.service}</p>
          <p>Please log in to accept or decline this booking.</p>
          <p>Best regards,<br>The Tailor Connect Team</p>
        `,
        text: `New booking request from ${customer.firstName} ${customer.lastName}`
      });
    }
  }

  async sendBookingStatusUpdate(booking, customer, tailor, status) {
    const statusMessages = {
      accepted: 'accepted your booking',
      declined: 'declined your booking',
      completed: 'marked your booking as completed',
      cancelled: 'cancelled your booking'
    };

    await this.sendEmail({
      to: customer.email,
      subject: `Booking ${status.charAt(0).toUpperCase() + status.slice(1)} - Tailor Connect`,
      html: `
        <h1>Booking Update</h1>
        <p>Hi ${customer.firstName},</p>
        <p><strong>${tailor.businessName || tailor.username}</strong> has ${statusMessages[status]}.</p>
        <p><strong>Date:</strong> ${new Date(booking.date).toLocaleDateString()}</p>
        <p><strong>Time:</strong> ${booking.startTime} - ${booking.endTime}</p>
        ${status === 'accepted' ? '<p>Please be ready for your appointment!</p>' : ''}
        ${status === 'completed' ? '<p>We hope you had a great experience. Please leave a review!</p>' : ''}
        <p>Best regards,<br>The Tailor Connect Team</p>
      `,
      text: `Your booking has been ${status}`
    });
  }

  async sendNewMessageNotification(conversation, sender, recipient) {
    await this.sendEmail({
      to: recipient.email,
      subject: 'New Message - Tailor Connect',
      html: `
        <h1>You have a new message!</h1>
        <p>Hi ${recipient.firstName},</p>
        <p><strong>${sender.firstName}</strong> sent you a message on Tailor Connect.</p>
        <p>Log in to view and reply to the message.</p>
        <p>Best regards,<br>The Tailor Connect Team</p>
      `,
      text: `New message from ${sender.firstName}`
    });
  }

  async sendVerificationStatusUpdate(tailor, status) {
    const tailorUser = await this.getTailorUser(tailor.user);
    if (!tailorUser) return;

    const statusMessages = {
      approved: 'Congratulations! Your verification has been approved. You now have a verified badge on your profile.',
      rejected: 'Unfortunately, your verification request was not approved. Please ensure your documents are clear and valid, then try again.'
    };

    await this.sendEmail({
      to: tailorUser.email,
      subject: `Verification ${status.charAt(0).toUpperCase() + status.slice(1)} - Tailor Connect`,
      html: `
        <h1>Verification Update</h1>
        <p>Hi ${tailorUser.firstName},</p>
        <p>${statusMessages[status]}</p>
        <p>Best regards,<br>The Tailor Connect Team</p>
      `,
      text: `Your verification has been ${status}`
    });
  }

  async getTailorUser(userId) {
    // This will be imported dynamically to avoid circular dependencies
    const User = (await import('../models/User.js')).default;
    return User.findById(userId);
  }

  // Order-related email notifications

  async sendNewOrderNotification(order, customer, tailor, planDeadline) {
    const tailorUser = await this.getTailorUser(tailor.user);
    if (!tailorUser) return;

    await this.sendEmail({
      to: tailorUser.email,
      subject: 'New Order - Create Your Work Plan',
      html: `
        <h1>New Order Received!</h1>
        <p>Hi ${tailorUser.firstName},</p>
        <p>You have a new paid order from <strong>${customer.firstName} ${customer.lastName}</strong>.</p>
        <p><strong>Deadline to create work plan:</strong> ${planDeadline.toLocaleDateString()} at ${planDeadline.toLocaleTimeString()}</p>
        <p>Please log in and create a work plan with stages and estimated timelines for this order.</p>
        <p>Best regards,<br>The Tailor Connect Team</p>
      `,
      text: `New order received! Please create a work plan by ${planDeadline.toLocaleDateString()}`
    });
  }

  async sendWorkPlanSubmitted(order, customer, tailor) {
    const totalDays = order.workPlan.totalEstimatedDays;
    const stages = order.workPlan.stages;

    await this.sendEmail({
      to: customer.email,
      subject: 'Work Plan Ready for Review',
      html: `
        <h1>Work Plan Submitted</h1>
        <p>Hi ${customer.firstName},</p>
        <p><strong>${tailor.businessName || tailor.username}</strong> has submitted a work plan for your order.</p>
        <h2>Work Plan Summary</h2>
        <p><strong>Total Estimated Days:</strong> ${totalDays}</p>
        <p><strong>Stages:</strong></p>
        <ul>
          ${stages.map((s, i) => `<li><strong>${s.name}</strong> - ${s.estimatedDays} day(s)<br><small>${s.description || ''}</small></li>`).join('')}
        </ul>
        <p>Please log in to approve or request changes to this plan.</p>
        <p>Best regards,<br>The Tailor Connect Team</p>
      `,
      text: `Work plan submitted. Total estimated days: ${totalDays}`
    });
  }

  async sendWorkPlanApproved(order, tailor) {
    const tailorUser = await this.getTailorUser(tailor.user);
    if (!tailorUser) return;

    await this.sendEmail({
      to: tailorUser.email,
      subject: 'Work Plan Approved - Start Working!',
      html: `
        <h1>Work Plan Approved!</h1>
        <p>Hi ${tailorUser.firstName},</p>
        <p>Great news! Your work plan has been approved. You can now start working on the order.</p>
        <p><strong>Estimated Completion:</strong> ${order.workPlan.estimatedCompletion.toLocaleDateString()}</p>
        <p>Remember to update the progress as you complete each stage.</p>
        <p>Best regards,<br>The Tailor Connect Team</p>
      `,
      text: `Work plan approved! Start working now.`
    });
  }

  async sendWorkPlanRejected(order, tailor, reason) {
    const tailorUser = await this.getTailorUser(tailor.user);
    if (!tailorUser) return;

    await this.sendEmail({
      to: tailorUser.email,
      subject: 'Work Plan Needs Revision',
      html: `
        <h1>Work Plan Revision Needed</h1>
        <p>Hi ${tailorUser.firstName},</p>
        <p>The customer has requested changes to your work plan.</p>
        <p><strong>Feedback:</strong> ${reason}</p>
        <p>Please log in to review and submit a revised work plan.</p>
        <p>Best regards,<br>The Tailor Connect Team</p>
      `,
      text: `Work plan revision needed. Reason: ${reason}`
    });
  }

  async sendStageCompleted(order, customer, stage, progressPercentage) {
    await this.sendEmail({
      to: customer.email,
      subject: `Order Progress Update - ${progressPercentage}% Complete`,
      html: `
        <h1>Order Progress Update</h1>
        <p>Hi ${customer.firstName},</p>
        <p>Great news! A stage of your order has been completed.</p>
        <p><strong>Completed Stage:</strong> ${stage.name}</p>
        <p><strong>Overall Progress:</strong> ${progressPercentage}%</p>
        <div style="background: #e5e7eb; border-radius: 8px; height: 20px; width: 100%; max-width: 300px;">
          <div style="background: #22c55e; border-radius: 8px; height: 100%; width: ${progressPercentage}%;"></div>
        </div>
        <p>Log in to see more details about your order progress.</p>
        <p>Best regards,<br>The Tailor Connect Team</p>
      `,
      text: `Stage "${stage.name}" completed. Overall progress: ${progressPercentage}%`
    });
  }

  async sendDelayRequestNotification(order, customer, reason, additionalDays) {
    await this.sendEmail({
      to: customer.email,
      subject: 'Delay Request for Your Order',
      html: `
        <h1>Delay Request</h1>
        <p>Hi ${customer.firstName},</p>
        <p>The tailor has requested additional time for your order.</p>
        <p><strong>Reason:</strong> ${reason}</p>
        <p><strong>Additional Days Requested:</strong> ${additionalDays}</p>
        <p>Please log in to approve or decline this request.</p>
        <p>Best regards,<br>The Tailor Connect Team</p>
      `,
      text: `Delay request: ${additionalDays} additional days needed. Reason: ${reason}`
    });
  }

  async sendDelayRequestAdmin(order, reason, additionalDays) {
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) return;

    await this.sendEmail({
      to: adminEmail,
      subject: `[Admin] Delay Request - Order ${order._id}`,
      html: `
        <h1>Delay Request Alert</h1>
        <p>A tailor has requested a delay for an order.</p>
        <p><strong>Order ID:</strong> ${order._id}</p>
        <p><strong>Reason:</strong> ${reason}</p>
        <p><strong>Additional Days:</strong> ${additionalDays}</p>
        <p>Log in to the admin panel to review.</p>
      `,
      text: `Delay request for order ${order._id}`
    });
  }

  async sendDelayRequestResponse(order, tailor, approved, notes) {
    const tailorUser = await this.getTailorUser(tailor.user);
    if (!tailorUser) return;

    await this.sendEmail({
      to: tailorUser.email,
      subject: `Delay Request ${approved ? 'Approved' : 'Declined'}`,
      html: `
        <h1>Delay Request ${approved ? 'Approved' : 'Declined'}</h1>
        <p>Hi ${tailorUser.firstName},</p>
        <p>Your delay request has been <strong>${approved ? 'approved' : 'declined'}</strong>.</p>
        ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ''}
        ${approved ? `<p>The estimated completion date has been updated.</p>` : '<p>Please try to complete the order by the original deadline.</p>'}
        <p>Best regards,<br>The Tailor Connect Team</p>
      `,
      text: `Delay request ${approved ? 'approved' : 'declined'}`
    });
  }

  async sendOrderCompletedNotification(order, tailor) {
    const tailorUser = await this.getTailorUser(tailor.user);
    if (!tailorUser) return;

    await this.sendEmail({
      to: tailorUser.email,
      subject: 'Order Completed - Customer Confirmed!',
      html: `
        <h1>Order Completed!</h1>
        <p>Hi ${tailorUser.firstName},</p>
        <p>Congratulations! The customer has confirmed receipt and completion of the order.</p>
        ${order.completionFeedback?.rating ? `<p><strong>Rating:</strong> ${'★'.repeat(order.completionFeedback.rating)}${'☆'.repeat(5 - order.completionFeedback.rating)}</p>` : ''}
        ${order.completionFeedback?.comment ? `<p><strong>Feedback:</strong> "${order.completionFeedback.comment}"</p>` : ''}
        <p>Thank you for your great work!</p>
        <p>Best regards,<br>The Tailor Connect Team</p>
      `,
      text: `Order completed! Customer has confirmed delivery.`
    });
  }

  async sendOrderCompletedAdmin(order) {
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) return;

    await this.sendEmail({
      to: adminEmail,
      subject: `[Admin] Order Completed - ${order._id}`,
      html: `
        <h1>Order Completed</h1>
        <p>An order has been marked as completed.</p>
        <p><strong>Order ID:</strong> ${order._id}</p>
        <p><strong>Completed At:</strong> ${order.completedAt.toLocaleDateString()}</p>
        ${order.completionFeedback?.rating ? `<p><strong>Customer Rating:</strong> ${order.completionFeedback.rating}/5</p>` : ''}
      `,
      text: `Order ${order._id} completed`
    });
  }

  async sendOrderCancelledNotification(order, recipient, cancelledBy) {
    await this.sendEmail({
      to: recipient.email,
      subject: 'Order Cancelled',
      html: `
        <h1>Order Cancelled</h1>
        <p>Hi ${recipient.firstName},</p>
        <p>An order has been cancelled by the ${cancelledBy}.</p>
        ${order.cancellationReason ? `<p><strong>Reason:</strong> ${order.cancellationReason}</p>` : ''}
        <p>If you have any questions, please contact support.</p>
        <p>Best regards,<br>The Tailor Connect Team</p>
      `,
      text: `Order cancelled by ${cancelledBy}`
    });
  }

  async sendPlanDeadlineReminder(order, tailor) {
    const tailorUser = await this.getTailorUser(tailor.user);
    if (!tailorUser) return;

    const hoursLeft = Math.round((order.planDeadline - new Date()) / (1000 * 60 * 60));

    await this.sendEmail({
      to: tailorUser.email,
      subject: 'Reminder: Work Plan Due Soon',
      html: `
        <h1>Work Plan Deadline Approaching</h1>
        <p>Hi ${tailorUser.firstName},</p>
        <p>This is a reminder that you have approximately <strong>${hoursLeft} hours</strong> left to submit your work plan for an order.</p>
        <p>Please log in and create the work plan to avoid delays.</p>
        <p>Best regards,<br>The Tailor Connect Team</p>
      `,
      text: `Reminder: ${hoursLeft} hours left to submit work plan`
    });
  }

  async sendPlanOverdueNotification(order, tailor, customer) {
    // Notify admin
    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail) {
      await this.sendEmail({
        to: adminEmail,
        subject: `[ALERT] Work Plan Overdue - Order ${order._id}`,
        html: `
          <h1>Work Plan Overdue</h1>
          <p>A tailor has not submitted their work plan by the deadline.</p>
          <p><strong>Order ID:</strong> ${order._id}</p>
          <p><strong>Deadline:</strong> ${order.planDeadline.toLocaleDateString()}</p>
          <p>Please review and take appropriate action.</p>
        `,
        text: `Work plan overdue for order ${order._id}`
      });
    }

    // Notify customer
    await this.sendEmail({
      to: customer.email,
      subject: 'Update on Your Order',
      html: `
        <h1>Order Update</h1>
        <p>Hi ${customer.firstName},</p>
        <p>We noticed that the work plan for your order hasn't been submitted yet. Our team has been notified and is looking into this.</p>
        <p>We'll keep you updated on the status.</p>
        <p>Best regards,<br>The Tailor Connect Team</p>
      `,
      text: `We're working on getting your order plan ready.`
    });
  }
}

export default new EmailService();
