<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class NewManagementTicket implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly string $suggestionId,
        public readonly string $ticketNumber,
        public readonly string $title,
    ) {}

    public function broadcastOn(): array
    {
        return [new PrivateChannel('management.notifications')];
    }

    public function broadcastAs(): string
    {
        return 'ticket.created';
    }
}
