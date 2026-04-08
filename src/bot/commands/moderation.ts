import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { ModerationService } from '../../services/moderation.service';
import logger from '../../utils/logger';

export const moderationCommand = new SlashCommandBuilder()
  .setName('moderation')
  .setDescription('Moderation management commands')
  .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
  .addSubcommand(subcommand =>
    subcommand
      .setName('settings')
      .setDescription('View or update moderation settings')
      .addStringOption(option =>
        option
          .setName('action')
          .setDescription('Action to perform')
          .setRequired(true)
          .addChoices(
            { name: 'view', value: 'view' },
            { name: 'enable', value: 'enable' },
            { name: 'disable', value: 'disable' }
          )
      )
      .addStringOption(option =>
        option
          .setName('feature')
          .setDescription('Feature to configure')
          .addChoices(
            { name: 'automod', value: 'automod' },
            { name: 'wordfilter', value: 'wordfilter' },
            { name: 'spamfilter', value: 'spamfilter' },
            { name: 'linkfilter', value: 'linkfilter' }
          )
      )
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('history')
      .setDescription('View moderation history for a user')
      .addUserOption(option =>
        option
          .setName('user')
          .setDescription('User to check history for')
          .setRequired(true)
      )
      .addIntegerOption(option =>
        option
          .setName('limit')
          .setDescription('Number of entries to show')
          .setMinValue(1)
          .setMaxValue(50)
      )
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('analytics')
      .setDescription('View moderation analytics')
      .addStringOption(option =>
        option
          .setName('period')
          .setDescription('Time period')
          .setRequired(true)
          .addChoices(
            { name: '24h', value: '24h' },
            { name: '7d', value: '7d' },
            { name: '30d', value: '30d' }
          )
      )
  );

export class ModerationCommandHandler {
  constructor(private moderationService: ModerationService) {}

  async handle(interaction: ChatInputCommandInteraction): Promise<void> {
    try {
      await interaction.deferReply({ ephemeral: true });

      const subcommand = interaction.options.getSubcommand();

      switch (subcommand) {
        case 'settings':
          await this.handleSettings(interaction);
          break;
        case 'history':
          await this.handleHistory(interaction);
          break;
        case 'analytics':
          await this.handleAnalytics(interaction);
          break;
        default:
          await interaction.editReply({
            content: 'Unknown subcommand'
          });
      }
    } catch (error) {
      logger.error('Error in moderation command:', error);
      await interaction.editReply({
        content: 'An error occurred while processing your command.'
      });
    }
  }

  private async handleSettings(interaction: ChatInputCommandInteraction): Promise<void> {
    const action = interaction.options.getString('action', true);
    const feature = interaction.options.getString('feature');

    const guildId = interaction.guildId!;

    try {
      const config = await this.moderationService.getServerConfig(guildId);

      if (action === 'view') {
        const embed = new EmbedBuilder()
          .setTitle('Moderation Settings')
          .setColor(0x00AE86)
          .addFields(
            { name: 'Auto-Moderation', value: config.autoModeration ? '✅ Enabled' : '❌ Disabled', inline: true },
            { name: 'Word Filter', value: config.wordFilterEnabled ? '✅ Enabled' : '❌ Disabled', inline: true },
            { name: 'Spam Filter', value: config.spamFilterEnabled ? '✅ Enabled' : '❌ Disabled', inline: true },
            { name: 'Link Filter', value: config.linkFilterEnabled ? '✅ Enabled' : '❌ Disabled', inline: true }
          )
          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
      } else if (action === 'enable' || action === 'disable') {
        if (!feature) {
          await interaction.editReply({
            content: 'Please specify a feature to enable/disable.'
          });
          return;
        }

        const updates: any = {};
        switch (feature) {
          case 'automod':
            updates.autoModeration = action === 'enable';
            break;
          case 'wordfilter':
            updates.wordFilterEnabled = action === 'enable';
            break;
          case 'spamfilter':
            updates.spamFilterEnabled = action === 'enable';
            break;
          case 'linkfilter':
            updates.linkFilterEnabled = action === 'enable';
            break;
        }

        await this.moderationService.updateServerConfig(guildId, updates);

        await interaction.editReply({
          content: `✅ ${feature.charAt(0).toUpperCase() + feature.slice(1)} has been ${action}d.`
        });
      }
    } catch (error) {
      logger.error('Error handling moderation settings:', error);
      await interaction.editReply({
        content: 'Failed to update moderation settings.'
      });
    }
  }

  private async handleHistory(interaction: ChatInputCommandInteraction): Promise<void> {
    const user = interaction.options.getUser('user', true);
    const limit = interaction.options.getInteger('limit') || 10;

    try {
      // This would need to be implemented in ModerationService
      const history = await this.getUserModerationHistory(user.id, limit);

      const embed = new EmbedBuilder()
        .setTitle(`Moderation History for ${user.tag}`)
        .setColor(0x00AE86)
        .setThumbnail(user.displayAvatarURL());

      if (history.length === 0) {
        embed.setDescription('No moderation history found for this user.');
      } else {
        history.forEach((entry, index) => {
          embed.addFields({
            name: `${index + 1}. ${entry.type.charAt(0).toUpperCase() + entry.type.slice(1)}`,
            value: `**Reason:** ${entry.reason}\n**Date:** ${new Date(entry.createdAt).toLocaleDateString()}\n**Moderator:** ${entry.moderatorTag}`,
            inline: false
          });
        });
      }

      embed.setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      logger.error('Error handling moderation history:', error);
      await interaction.editReply({
        content: 'Failed to retrieve moderation history.'
      });
    }
  }

  private async handleAnalytics(interaction: ChatInputCommandInteraction): Promise<void> {
    const period = interaction.options.getString('period', true);

    try {
      const analytics = await this.getModerationAnalytics(interaction.guildId!, period);

      const embed = new EmbedBuilder()
        .setTitle(`Moderation Analytics (${period})`)
        .setColor(0x00AE86)
        .addFields(
          { name: 'Total Actions', value: analytics.totalActions.toString(), inline: true },
          { name: 'Warnings', value: analytics.warnings.toString(), inline: true },
          { name: 'Timeouts', value: analytics.timeouts.toString(), inline: true },
          { name: 'Kicks', value: analytics.kicks.toString(), inline: true },
          { name: 'Bans', value: analytics.bans.toString(), inline: true },
          { name: 'Active Cases', value: analytics.activeCases.toString(), inline: true }
        )
        .setTimestamp();

      if (analytics.topViolators.length > 0) {
        const topViolatorsText = analytics.topViolators
          .slice(0, 3)
          .map((user, index) => `${index + 1}. ${user.tag} (${user.violations} violations)`)
          .join('\n');

        embed.addFields({
          name: 'Top Violators',
          value: topViolatorsText,
          inline: false
        });
      }

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      logger.error('Error handling moderation analytics:', error);
      await interaction.editReply({
        content: 'Failed to retrieve moderation analytics.'
      });
    }
  }

  // These methods would need to be implemented in the service
  private async getUserModerationHistory(userId: string, limit: number): Promise<any[]> {
    // Placeholder implementation
    return [];
  }

  private async getModerationAnalytics(guildId: string, period: string): Promise<any> {
    // Placeholder implementation
    return {
      totalActions: 0,
      warnings: 0,
      timeouts: 0,
      kicks: 0,
      bans: 0,
      activeCases: 0,
      topViolators: []
    };
  }
}
