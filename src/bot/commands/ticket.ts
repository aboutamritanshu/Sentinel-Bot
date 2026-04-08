import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, ChannelType } from 'discord.js';
import { PrismaClient } from '@prisma/client';
import { TicketService } from '../../services/ticket.service';
import { ModerationService } from '../../services/moderation.service';
import logger from '../../utils/logger';

export const ticketCommand = new SlashCommandBuilder()
  .setName('ticket')
  .setDescription('Manage support tickets')
  .addSubcommand(subcommand =>
    subcommand
      .setName('create')
      .setDescription('Create a new support ticket')
      .addStringOption(option =>
        option
          .setName('category')
          .setDescription('Ticket category')
          .setRequired(true)
          .addChoices(
            { name: 'General Support', value: 'general' },
            { name: 'Bug Report', value: 'bug' },
            { name: 'Feature Request', value: 'feature' },
            { name: 'Account Issue', value: 'account' },
            { name: 'Other', value: 'other' }
          )
      )
      .addStringOption(option =>
        option
          .setName('description')
          .setDescription('Brief description of the issue')
          .setRequired(false)
      )
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('close')
      .setDescription('Close the current ticket')
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages);

export class TicketCommandHandler {
  constructor(
    private prisma: PrismaClient,
    private ticketService: TicketService,
    private moderationService: ModerationService
  ) {}

  async handle(interaction: ChatInputCommandInteraction): Promise<void> {
    try {
      const subcommand = interaction.options.getSubcommand();

      switch (subcommand) {
        case 'create':
          await this.handleCreate(interaction);
          break;
        case 'close':
          await this.handleClose(interaction);
          break;
        default:
          await interaction.reply('Invalid subcommand.');
      }
    } catch (error) {
      logger.error('Error handling ticket command:', error);
      await interaction.reply('An error occurred while processing your ticket. Please try again later.');
    }
  }

  private async handleCreate(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply({ ephemeral: true });

    try {
      const category = interaction.options.get('category')?.value as string;
      const description = interaction.options.get('description')?.value as string;

      const user = await this.moderationService.getOrCreateUser(interaction.user.id);

      const existingTicket = await this.prisma.ticket.findFirst({
        where: {
          creatorId: user.id,
          status: 'open'
        }
      });

      if (existingTicket) {
        await interaction.editReply('You already have an open ticket. Please close it before creating a new one.');
        return;
      }

      const guild = interaction.guild!;
      const categoryChannel = guild.channels.cache.find(c => c.name === 'tickets');
      
      const ticketChannel = await guild.channels.create({
        name: `ticket-${user.discordId.slice(-4)}`,
        type: ChannelType.GuildText,
        parent: categoryChannel?.id || null,
        permissionOverwrites: [
          {
            id: guild.id,
            deny: [PermissionFlagsBits.ViewChannel]
          },
          {
            id: user.discordId,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
          },
          {
            id: interaction.client.user!.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
          }
        ]
      });

      const ticket = await this.ticketService.createTicket({
        creatorId: user.id,
        categoryId: category,
        category,
        description
      }, ticketChannel.id);

      const welcomeMessage = `🎫 **New Ticket Created**\n\n` +
        `**Ticket ID:** ${ticket.id}\n` +
        `**Category:** ${category}\n` +
        `**Created by:** ${interaction.user.username}\n` +
        `${description ? `**Description:** ${description}\n` : ''}\n\n` +
        `Please describe your issue in detail. Support staff will assist you shortly.\n` +
        `Use \`/ticket close\` when your issue is resolved.`;

      await ticketChannel.send(welcomeMessage);

      await interaction.editReply({
        content: `✅ **Ticket Created**\n\n` +
          `Your ticket has been created in <#${ticketChannel.id}>\n` +
          `**Ticket ID:** ${ticket.id}\n` +
          `**Category:** ${category}`
      });

      logger.info(`Created ticket ${ticket.id} for user ${user.discordId}`);
    } catch (error) {
      logger.error('Error creating ticket:', error);
      await interaction.editReply('Failed to create ticket. Please try again later.');
    }
  }

  private async handleClose(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply({ ephemeral: true });

    try {
      const user = await this.moderationService.getOrCreateUser(interaction.user.id);

      const ticket = await this.prisma.ticket.findFirst({
        where: {
          creatorId: user.id,
          status: 'open',
          channelId: interaction.channelId
        }
      });

      if (!ticket) {
        await interaction.editReply('No open ticket found in this channel.');
        return;
      }

      const channel = interaction.channel as any;
      const messages = await channel.messages.fetch({ limit: 100 });

      const conversation = messages
        .filter((msg: any) => !msg.author.bot)
        .map((msg: any) => ({
          author: msg.author.username,
          content: msg.content,
          timestamp: msg.createdAt.toISOString()
        }))
        .reverse()
        .slice(0, 50);

      const { ticket: _closedTicket, summary } = await this.ticketService.closeTicket(
        ticket.id,
        conversation
      );

      const summaryMessage = `📋 **Ticket Summary**\n\n` +
        `**Issue:** ${summary.issue}\n` +
        `**Highlights:** ${summary.highlights}\n` +
        `**Resolution:** ${summary.resolution}\n\n` +
        `This ticket will be archived in 5 minutes.`;

      await channel.send(summaryMessage);

      setTimeout(async () => {
        try {
          await channel.delete();
        } catch (error) {
          logger.error('Error deleting ticket channel:', error);
        }
      }, 5 * 60 * 1000);

      await interaction.editReply({
        content: `✅ **Ticket Closed**\n\n` +
          `**Ticket ID:** ${ticket.id}\n` +
          `**Issue:** ${summary.issue}\n` +
          `**Resolution:** ${summary.resolution}\n\n` +
          `Thank you for using our support system!`
      });

      logger.info(`Closed ticket ${ticket.id} with AI summary`);
    } catch (error) {
      logger.error('Error closing ticket:', error);
      await interaction.editReply('Failed to close ticket. Please try again later.');
    }
  }
}
