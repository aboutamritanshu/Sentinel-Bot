import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, version } from 'discord.js';
import { SentinelAI } from '../../index';
import logger from '../../utils/logger';

export const utilityCommand = new SlashCommandBuilder()
  .setName('utility')
  .setDescription('Utility commands for server management')
  .addSubcommand(subcommand =>
    subcommand
      .setName('serverinfo')
      .setDescription('Display server information')
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('userstats')
      .setDescription('Display user statistics')
      .addUserOption(option =>
        option
          .setName('user')
          .setDescription('User to get stats for (defaults to you)')
          .setRequired(false)
      )
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('help')
      .setDescription('Display help information')
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('ping')
      .setDescription('Check bot latency')
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('uptime')
      .setDescription('Check bot uptime')
  );

export class UtilityCommandHandler {
  constructor(private bot: SentinelAI) {}

  async handle(interaction: ChatInputCommandInteraction): Promise<void> {
    try {
      await interaction.deferReply();

      const subcommand = interaction.options.getSubcommand();

      switch (subcommand) {
        case 'serverinfo':
          await this.handleServerInfo(interaction);
          break;
        case 'userstats':
          await this.handleUserStats(interaction);
          break;
        case 'help':
          await this.handleHelp(interaction);
          break;
        case 'ping':
          await this.handlePing(interaction);
          break;
        case 'uptime':
          await this.handleUptime(interaction);
          break;
        default:
          await interaction.editReply({
            content: 'Unknown subcommand'
          });
      }
    } catch (error) {
      logger.error('Error in utility command:', error);
      await interaction.editReply({
        content: 'An error occurred while processing your command.'
      });
    }
  }

  private async handleServerInfo(interaction: ChatInputCommandInteraction): Promise<void> {
    const guild = interaction.guild!;
    
    const embed = new EmbedBuilder()
      .setTitle(`Server Information: ${guild.name}`)
      .setColor(0x00AE86)
      .setThumbnail(guild.iconURL())
      .addFields(
        { name: 'Server ID', value: guild.id, inline: true },
        { name: 'Owner', value: `<@${guild.ownerId}>`, inline: true },
        { name: 'Created', value: guild.createdAt.toLocaleDateString(), inline: true },
        { name: 'Members', value: guild.memberCount.toString(), inline: true },
        { name: 'Channels', value: guild.channels.cache.size.toString(), inline: true },
        { name: 'Roles', value: guild.roles.cache.size.toString(), inline: true },
        { name: 'Boost Level', value: this.getBoostLevel(guild.premiumTier), inline: true },
        { name: 'Boosts', value: guild.premiumSubscriptionCount?.toString() || '0', inline: true }
      )
      .setFooter({ text: `Requested by ${interaction.user.tag}` })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  }

  private async handleUserStats(interaction: ChatInputCommandInteraction): Promise<void> {
    const targetUser = interaction.options.getUser('user') || interaction.user;
    const member = await interaction.guild!.members.fetch(targetUser.id);

    const embed = new EmbedBuilder()
      .setTitle(`User Statistics: ${targetUser.tag}`)
      .setColor(0x00AE86)
      .setThumbnail(targetUser.displayAvatarURL())
      .addFields(
        { name: 'User ID', value: targetUser.id, inline: true },
        { name: 'Joined Server', value: member?.joinedAt?.toLocaleDateString() || 'Unknown', inline: true },
        { name: 'Account Created', value: targetUser.createdAt.toLocaleDateString(), inline: true },
        { name: 'Roles', value: member?.roles.cache.map(role => role.name).join(', ') || 'None', inline: false }
      )
      .setFooter({ text: `Requested by ${interaction.user.tag}` })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  }

  private async handleHelp(interaction: ChatInputCommandInteraction): Promise<void> {
    const embed = new EmbedBuilder()
      .setTitle('Sentinel AI - Help & Commands')
      .setColor(0x00AE86)
      .setDescription('Here are all available commands:')
      .addFields(
        {
          name: '🛡️ Moderation Commands',
          value: '`/report` - Report a user for inappropriate behavior\n`/ticket` - Create or manage support tickets\n`/moderation` - Manage moderation settings',
          inline: false
        },
        {
          name: '🔧 Utility Commands',
          value: '`/utility serverinfo` - Display server information\n`/utility userstats` - Display user statistics\n`/utility ping` - Check bot latency\n`/utility uptime` - Check bot uptime',
          inline: false
        },
        {
          name: '📊 Admin API',
          value: 'Administrative endpoints available at `/api/admin/*`\nRequires authentication and proper permissions',
          inline: false
        },
        {
          name: '🤖 Features',
          value: '• AI-powered content moderation\n• Smart dispute resolution\n• Automated ticket summarization\n• Real-time analytics',
          inline: false
        }
      )
      .setFooter({ text: 'Sentinel AI - Advanced Discord Moderation Bot' })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  }

  private async handlePing(interaction: ChatInputCommandInteraction): Promise<void> {
    const startTime = Date.now();
    await interaction.editReply('Pinging...');
    
    const apiLatency = Date.now() - startTime;
    const websocketLatency = interaction.client.ws.ping;

    const embed = new EmbedBuilder()
      .setTitle('🏓 Pong!')
      .setColor(0x00AE86)
      .addFields(
        { name: 'API Latency', value: `${apiLatency}ms`, inline: true },
        { name: 'WebSocket Latency', value: `${websocketLatency}ms`, inline: true },
        { name: 'Status', value: apiLatency < 200 ? '🟢 Excellent' : apiLatency < 500 ? '🟡 Good' : '🔴 Poor', inline: true }
      )
      .setFooter({ text: `Requested by ${interaction.user.tag}` })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  }

  private async handleUptime(interaction: ChatInputCommandInteraction): Promise<void> {
    const uptime = process.uptime();
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);

    const uptimeString = `${days}d ${hours}h ${minutes}m ${seconds}s`;

    const embed = new EmbedBuilder()
      .setTitle('⏰ Bot Uptime')
      .setColor(0x00AE86)
      .addFields(
        { name: 'Uptime', value: uptimeString, inline: true },
        { name: 'Process Started', value: new Date(Date.now() - uptime * 1000).toLocaleString(), inline: true },
        { name: 'Version', value: process.env['npm_package_version'] || '1.0.0', inline: true }
      )
      .setFooter({ text: `Requested by ${interaction.user.tag}` })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  }

  private getBoostLevel(tier: number): string {
    switch (tier) {
      case 0: return 'None';
      case 1: return 'Level 1';
      case 2: return 'Level 2';
      case 3: return 'Level 3';
      default: return 'Unknown';
    }
  }
}
