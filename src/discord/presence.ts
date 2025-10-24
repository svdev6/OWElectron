import RPC from 'discord-rpc';

export class DiscordPresence {
    private rpc: RPC.Client | null = null;
    private ready = false;

    constructor(private clientId: string) {
        this.connect();
    }

    private connect() {
        this.rpc = new RPC.Client({ transport: 'ipc' });
        this.ready = false;

        this.rpc.on('ready', () => {
            this.ready = true;
            this.clearActivity();
        });

        this.rpc.on('disconnected', () => {
            this.ready = false;
            setTimeout(() => this.connect(), 3000);
        });

        this.rpc.login({ clientId: this.clientId }).catch(() => {
            setTimeout(() => this.connect(), 5000);
        });
    }

    async setActivity(activity: RPC.Presence) {
        if (!this.ready || !this.rpc) return;
        try { await this.rpc.setActivity(activity); } catch {}
    }

    async clearActivity() {
        if (!this.ready || !this.rpc) return;
        try { await this.rpc.clearActivity(); } catch {}
    }

    destroy() {
        try { this.rpc?.destroy(); } catch {}
    }
}