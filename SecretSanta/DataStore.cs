using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;

namespace WebApplicationRazor
{
    public static class DataStore
    {
        public static List<string> Participants { get; } = new List<string>();
        public static ConcurrentDictionary<string, string> Assignments { get; } = new ConcurrentDictionary<string, string>();
        public static ConcurrentDictionary<string, string> Wishes { get; } = new ConcurrentDictionary<string, string>();
        public static readonly object Lock = new object();
    }
}