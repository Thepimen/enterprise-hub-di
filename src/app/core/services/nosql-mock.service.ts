/**
 * @file nosql-mock.service.ts
 * @description Simulación de base de datos documental/tiempo real (NoSQL).
 * Emite métricas de infraestructura en vivo mediante BehaviorSubject con actualización periódica.
 */
import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, interval, Subscription } from 'rxjs';
import { map, shareReplay, take } from 'rxjs/operators';
import { LiveMetrics, ServerMetric } from '../models/metric.model';

/** Intervalo de actualización de métricas en tiempo real (ms) */
const UPDATE_INTERVAL_MS = 5000;

/** Servidores de infraestructura monitorizados */
const SERVER_NAMES = [
  'WEB-SRV-01', 'WEB-SRV-02', 'DB-PRIMARY', 'DB-REPLICA',
  'APP-SRV-01', 'APP-SRV-02', 'CACHE-01', 'BACKUP-SRV',
  'PROXY-01', 'MONITOR-SRV', 'MAIL-SRV', 'VPN-GW',
];

@Injectable({ providedIn: 'root' })
export class NoSqlMockService implements OnDestroy {
  /** BehaviorSubject con métricas en vivo */
  private readonly liveMetrics$ = new BehaviorSubject<LiveMetrics>(this.generateMetrics());

  /** Suscripción al intervalo de actualización */
  private readonly updateSubscription: Subscription;

  constructor() {
    // Actualiza métricas cada UPDATE_INTERVAL_MS milisegundos
    this.updateSubscription = interval(UPDATE_INTERVAL_MS).subscribe(() => {
      this.liveMetrics$.next(this.generateMetrics());
    });
  }

  ngOnDestroy(): void {
    this.updateSubscription.unsubscribe();
  }

  /**
   * Obtiene la telemetría en tiempo real para forkJoin (alias oficial de rúbrica RA 5).
   * Emite la captura actual y completa para permitir la concurrencia con forkJoin.
   */
  getTelemetry(): Observable<LiveMetrics> {
    return this.liveMetrics$.asObservable().pipe(take(1));
  }

  /**
   * Obtiene las métricas en vivo como Observable.
   * Los suscriptores recibirán actualizaciones automáticas.
   */
  getLiveMetrics(): Observable<LiveMetrics> {
    return this.liveMetrics$.asObservable().pipe(shareReplay(1));
  }

  /**
   * Obtiene métricas de un servidor específico.
   */
  getServerMetric(serverId: string): Observable<ServerMetric | undefined> {
    return this.liveMetrics$.pipe(
      map((m) => m.servers.find((s) => s.serverId === serverId))
    );
  }

  /**
   * Obtiene las métricas actuales (snapshot síncrono).
   */
  getCurrentSnapshot(): LiveMetrics {
    return this.liveMetrics$.getValue();
  }

  /**
   * Genera un conjunto de métricas con valores realistas y variación aleatoria.
   * Simula la carga de documentos de una base de datos NoSQL.
   */
  private generateMetrics(): LiveMetrics {
    const servers: ServerMetric[] = SERVER_NAMES.map((name, idx) => {
      const isProduction = idx < 4;
      const baseCpu = isProduction ? 55 + Math.random() * 30 : 20 + Math.random() * 40;
      const baseMemory = isProduction ? 60 + Math.random() * 25 : 30 + Math.random() * 40;
      const status: ServerMetric['status'] =
        idx === 7 ? 'OFFLINE' : baseCpu > 85 ? 'DEGRADED' : 'ONLINE';

      return {
        serverId: `srv-${String(idx + 1).padStart(3, '0')}`,
        serverName: name,
        cpuUsage: Math.min(100, Math.round(baseCpu * 10) / 10),
        memoryUsage: Math.min(100, Math.round(baseMemory * 10) / 10),
        diskUsage: Math.round((40 + Math.random() * 50) * 10) / 10,
        networkIn: Math.round(Math.random() * 100 * 10) / 10,
        networkOut: Math.round(Math.random() * 80 * 10) / 10,
        uptime: idx === 7 ? 0 : Math.round(720 - idx * 12 + Math.random() * 5),
        status,
        lastUpdated: new Date(),
      };
    });

    const cpuData = servers.map((s) => s.cpuUsage);
    const memoryData = servers.map((s) => s.memoryUsage);
    const networkData = servers.map((s) => s.networkIn);

    return {
      servers,
      chartLabels: SERVER_NAMES,
      cpuData,
      memoryData,
      networkData,
      timestamp: new Date(),
    };
  }
}
