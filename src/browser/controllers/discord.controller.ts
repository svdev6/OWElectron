import { ipcMain } from 'electron';
import { DiscordPresence } from '../../discord/presence';

export class DiscordController {
    private presence: DiscordPresence;

    constructor(clientId: string) {
        this.presence = new DiscordPresence(clientId);

        ipcMain.handle('presence:set', async (_e, activity) => {
            await this.presence.setActivity(activity);
        })

        ipcMain.handle('presence:clear', async () => {
            await this.presence.clearActivity();
        });
    }
}