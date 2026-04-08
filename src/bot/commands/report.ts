import { SlashCommandBuilder, ChatInputCommandInteraction, TextChannel } from 'discord.js';
import { ReportService } from '../../services/report.service';
import { ModerationService } from '../../services/moderation.service';
import logger from '../../utils/logger';

export const reportCommand = new SlashCommandBuilder()
  .setName('report')
  .setDescription('Report a user for inappropriate behavior')
  .addUserOption(option =>
    option
      .setName('user')
      .setDescription('The user to report')
      .setRequired(true)
  )
  .addStringOption(option =>
    option
      .setName('reason')
      .setDescription('Reason for the report')
      .setRequired(false)
  );

export class ReportCommandHandler {
  constructor(
    private reportService: ReportService,
    private moderationService: ModerationService
  ) {}

  async handle(interaction: ChatInputCommandInteraction): Promise<void> {
    try {
      await interaction.deferReply({ ephemeral: true });

      const reportedUser = interaction.options.getUser('user');
      const reason = interaction.options.get('reason')?.value as string;

      if (!reportedUser) {
        await interaction.editReply('Invalid user specified.');
        return;
      }

      if (reportedUser.id === interaction.user.id) {
        await interaction.editReply('You cannot report yourself.');
        return;
      }

      if (reportedUser.bot) {
        await interaction.editReply('You cannot report a bot.');
        return;
      }

      const reporter = await this.moderationService.getOrCreateUser(interaction.user.id);
      const reported = await this.moderationService.getOrCreateUser(reportedUser.id);

      const report = await this.reportService.createReport({
        reporterId: reporter.id,
        reportedUserId: reported.id,
        guildId: interaction.guildId!,
        channelId: interaction.channelId!,
        reason
      });

      const conversation = await this.fetchConversation(
        interaction.channel as TextChannel,
        interaction.user.id,
        reportedUser.id,
        20
      );

      const { report: _updatedReport, aiVerdict } = await this.reportService.analyzeReport(
        report.id,
        conversation
      );

      await this.applyAIVerdict(interaction, reportedUser.id, aiVerdict);

      await interaction.editReply({
        content: `✅ **Report Submitted**\n\n` +
          `**Reported User:** ${reportedUser.username}\n` +
          `**Report ID:** ${report.id}\n` +
          `**AI Analysis:** ${aiVerdict.recommendedAction.toUpperCase()}\n` +
          `**Reason:** ${aiVerdict.reason}\n\n` +
          `Thank you for helping keep the community safe!`
      });

      logger.info(`Report ${report.id} processed with AI verdict: ${aiVerdict.recommendedAction}`);
    } catch (error) {
      logger.error('Error handling report command:', error);
      await interaction.editReply('An error occurred while processing your report. Please try again later.');
    }
  }

  private async fetchConversation(
    channel: TextChannel,
    userId1: string,
    userId2: string,
    limit: number
  ): Promise<Array<{ author: string; content: string; timestamp: string }>> {
    try {
      const messages = await channel.messages.fetch({ limit: limit * 2 });
      
      return messages
        .filter(msg => 
          (msg.author.id === userId1 || msg.author.id === userId2) && 
          !msg.author.bot
        )
        .map(msg => ({
          author: msg.author.username,
          content: msg.content,
          timestamp: msg.createdAt.toISOString()
        }))
        .slice(0, limit);
    } catch (error) {
      logger.error('Error fetching conversation:', error);
      return [];
    }
  }

  private async applyAIVerdict(
    interaction: ChatInputCommandInteraction,
    reportedUserId: string,
    aiVerdict: any
  ): Promise<void> {
    try {
      if (!interaction.guild) return;

      const member = await interaction.guild.members.fetch(reportedUserId);

      switch (aiVerdict.recommendedAction) {
        case 'warn':
          await member.send(`⚠️ **Warning** - You have been reported and our AI system has issued a warning.\nReason: ${aiVerdict.reason}`).catch(() => {});
          break;

        case 'timeout':
          await member.timeout(30 * 60 * 1000, `AI-moderated timeout: ${aiVerdict.reason}`);
          await member.send(`🔇 **Timeout** - You have been timed out for 30 minutes.\nReason: ${aiVerdict.reason}`).catch(() => {});
          break;

        case 'ban':
          await member.ban({ reason: `AI-moderated ban: ${aiVerdict.reason}` });
          break;
      }
    } catch (error) {
      logger.error('Error applying AI verdict:', error);
    }
  }
}
