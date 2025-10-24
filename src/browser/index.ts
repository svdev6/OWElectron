import {app as ElectronApp } from 'electron';
import { Application } from "./application";
import { OverlayHotkeysService } from './services/overlay-hotkeys.service';
import { OverlayService } from './services/overlay.service';
import { GameEventsService } from './services/gep.service';
import { MainWindowController } from './controllers/main-window.controller';
import { DemoOSRWindowController } from './controllers/demo-osr-window.controller';
import { OverlayInputService } from './services/overlay-input.service';
import { DiscordController } from './controllers/discord.controller';

/**
 * TODO: Integrate your own dependency-injection library
 */

const DISCORD_CLIENT_ID = '1178778069104861194';
let discordController: DiscordController | null = null;

const bootstrap = (): Application => {

  if (!discordController) {
    discordController = new DiscordController(DISCORD_CLIENT_ID);
  }
  const overlayService = new OverlayService();
  const overlayHotkeysService = new OverlayHotkeysService(overlayService);
  const gepService = new GameEventsService();
  const inputService = new OverlayInputService(overlayService);

  const createDemoOsrWindowControllerFactory = (): DemoOSRWindowController => {
    const controller = new DemoOSRWindowController(overlayService);
    return controller;
  }

  const mainWindowController = new MainWindowController(
    gepService,
    overlayService,
    createDemoOsrWindowControllerFactory,
    overlayHotkeysService,
    inputService
  );

  return new Application(overlayService, gepService, mainWindowController);
}

const app = bootstrap();

ElectronApp.whenReady().then(() => {
  app.run();
});

ElectronApp.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    ElectronApp.quit();
  }
});
