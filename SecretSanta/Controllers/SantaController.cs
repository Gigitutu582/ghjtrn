using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using WebApplicationRazor.Models;

namespace WebApplicationRazor.Controllers
{
    [ApiController]
    [Route("api/santa")]
    public class SantaController : ControllerBase
    {
        private readonly ILogger<SantaController> _logger;

        public SantaController(ILogger<SantaController> logger)
        {
            _logger = logger;
        }

        // POST /api/santa/register
        [HttpPost("register")]
        public IActionResult Register([FromBody] RegisterRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Name))
                return BadRequest(new { error = "Имя не может быть пустым" });

            string name = request.Name.Trim();

            lock (DataStore.Lock)
            {
                // Уже есть подопечный?
                if (DataStore.Assignments.TryGetValue(name, out var existingGiftFor))
                    return Ok(new { userName = name, giftFor = existingGiftFor });

                // Участник есть, но распределения ещё не было
                if (DataStore.Participants.Any(p => string.Equals(p, name, StringComparison.OrdinalIgnoreCase)))
                    return Ok(new { userName = name, giftFor = (string)null });

                // Новый участник
                AddParticipantAndRedistribute(name);

                DataStore.Assignments.TryGetValue(name, out var giftFor);
                return Ok(new { userName = name, giftFor });
            }
        }

        // POST /api/santa/wish
        [HttpPost("wish")]
        public IActionResult SaveWish([FromBody] WishRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Name))
                return BadRequest(new { error = "Имя не может быть пустым" });

            if (string.IsNullOrWhiteSpace(request.Wish))
                return BadRequest(new { error = "Пожелание не может быть пустым" });

            string name = request.Name.Trim();

            lock (DataStore.Lock)
            {
                if (!DataStore.Participants.Any(p => string.Equals(p, name, StringComparison.OrdinalIgnoreCase)))
                    return NotFound(new { error = "Пользователь не найден" });

                DataStore.Wishes[name] = request.Wish;
                return Ok(new { status = "wish saved" });
            }
        }

        // GET /api/santa/wish/{name}
        [HttpGet("wish/{name}")]
        public IActionResult GetWish(string name)
        {
            if (string.IsNullOrWhiteSpace(name))
                return BadRequest(new { error = "Имя не может быть пустым" });

            lock (DataStore.Lock)
            {
                var realName = DataStore.Participants.FirstOrDefault(p =>
                    string.Equals(p, name, StringComparison.OrdinalIgnoreCase));

                if (realName == null)
                    return NotFound(new { error = "Пользователь не найден" });

                DataStore.Wishes.TryGetValue(realName, out var wish);
                return Ok(new { name = realName, wish = wish ?? "" });
            }
        }

        // Вспомогательный метод
        private void AddParticipantAndRedistribute(string name)
        {
            if (DataStore.Participants.Any(p => string.Equals(p, name, StringComparison.OrdinalIgnoreCase)))
                return;

            DataStore.Participants.Add(name);

            if (DataStore.Participants.Count >= 2)
            {
                var shuffled = DataStore.Participants.OrderBy(_ => Guid.NewGuid()).ToList();
                var newAssignments = new Dictionary<string, string>();

                for (int i = 0; i < shuffled.Count; i++)
                {
                    var giver = shuffled[i];
                    var receiver = shuffled[(i + 1) % shuffled.Count];
                    newAssignments[giver] = receiver;
                }

                DataStore.Assignments.Clear();
                foreach (var kv in newAssignments)
                    DataStore.Assignments[kv.Key] = kv.Value;
            }
        }
    }
}