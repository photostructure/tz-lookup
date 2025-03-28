describe("tzlookup", function () {
  this.timeout(10_000); // windows GHA is slow
  ("use strict");
  var tz;
  if (typeof tzlookup !== "undefined") {
    tz = tzlookup;
  } else {
    tz = require("./");
  }

  var lux;
  if (typeof luxon !== "undefined") {
    lux = luxon;
  } else {
    lux = require("luxon");
  }

  function stringify_item(x) {
    return "" + x;
  }

  function stringify_list(x) {
    return x.map(stringify_item).join(", ");
  }

  const standardTs = new Date("2023-01-01T00:00:00Z").getTime();
  const daylightSavingsTs = new Date("2023-07-01T00:00:00Z").getTime();

  /**
   * @param iana {string}
   * @param others {string[]}
   */
  function assert_any_iana_eql(iana, ...others) {
    const arr = others.flatMap((ea) => String(ea).split(","));
    // These shenanigans allow for conflicting regions to still be compared:
    const errors = [];
    for (const actual of arr) {
      try {
        assert_iana_eql(iana, actual);
        return;
      } catch (error) {
        errors.push(error);
      }
    }
    throw new Error(errors.map((ea) => ea.message).join(":"));
  }

  function assert_iana_eql(a, b) {
    if (a === b) return;
    const z1 = lux.IANAZone.create(a);
    const z2 = lux.IANAZone.create(b);
    if (!z1.isValid) throw new Error("a: invalid IANA zone: " + a);
    if (!z2.isValid) throw new Error("b: invalid IANA zone: " + b);
    {
      const z1_offset = z1.offset(standardTs);
      const z2_offset = z2.offset(standardTs);
      if (z1_offset !== z2_offset) {
        throw new Error(
          "expected " +
            a +
            "(" +
            z1_offset +
            ") to have the same standard-time offset as " +
            b +
            "(" +
            z2_offset +
            ")",
        );
      }
    }
    {
      const z1_offset = z1.offset(daylightSavingsTs);
      const z2_offset = z2.offset(daylightSavingsTs);
      if (z1_offset !== z2_offset) {
        throw new Error(
          "expected " +
            a +
            "(" +
            z1_offset +
            ") to have the same daylight-savings-time offset as " +
            b +
            "(" +
            z2_offset +
            ")",
        );
      }
    }
  }

  function pass(testcase) {
    const args = testcase[0];
    const expected = testcase[1];
    const expectedGeoTz = testcase[2] ?? expected;

    it(
      'should return "' + expected + '" given ' + stringify_list(args),
      function () {
        var actual = tz.apply(null, args);

        if (actual !== expected) {
          throw new Error(
            'expected "' + actual + '" to equal "' + expected + '"',
          );
        }
      },
    );

    if (globalThis.window == null) {
      const geo_tz = require("geo-tz");
      it(
        "should match the timezone from geo-tz given " + stringify_list(args),
        function () {
          assert_any_iana_eql(
            expectedGeoTz,
            ...geo_tz.find(...args.map(Number)),
          );
        },
      );
    }
  }

  function fail(args) {
    it("should fail given " + stringify_list(args), function () {
      try {
        tz.apply(null, args);
      } catch (err) {
        if (err.message === "invalid coordinates") {
          return;
        }
        throw err;
      }

      throw new Error("expected an exception to occur, but none did");
    });
  }

  const TestCases = [
    // These tests are hand-crafted for specific locations.
    [[40.7092, -74.0151], "America/New_York"],
    [[42.3668, -71.0546], "America/New_York"],
    [[41.8976, -87.6205], "America/Chicago"],
    [[47.6897, -122.4023], "America/Los_Angeles"],
    [[42.7235, -73.6931], "America/New_York"],
    [[42.5807, -83.0223], "America/Detroit"],
    [[36.8381, -84.85], "America/Kentucky/Monticello"],
    [[40.1674, -85.3583], "America/Indiana/Indianapolis"],
    [[37.9643, -86.7453], "America/Indiana/Tell_City"],
    [[38.6043, -90.2417], "America/Chicago"],
    [[41.1591, -104.8261], "America/Denver"],
    [[35.1991, -111.6348], "America/Phoenix"],
    [[43.1432, -115.675], "America/Boise"],
    [[47.5886, -122.3382], "America/Los_Angeles"],
    [[58.3168, -134.4397], "America/Juneau"],
    [[21.4381, -158.0493], "Pacific/Honolulu"],
    [[42.7, -80.0], "America/Toronto"],
    [[51.0036, -114.0161], "America/Edmonton"],
    [[-16.4965, -68.1702], "America/La_Paz"],
    [[-31.9369, 115.8453], "Australia/Perth"],
    [[42.0, -87.5], "America/Chicago"],
    [[36.9147, -111.4558], "America/Phoenix"], // #7
    [[46.1328, -64.7714], "America/Moncton"],
    [[44.928, -87.1853], "America/Chicago"], // #13
    [[50.7029, -57.3511], "America/St_Johns"], // #13
    [[29.9414, -85.4064], "America/Chicago"], // #14
    [[49.7261, -1.9104], "Europe/Paris"], // #15
    [[65.528, 23.557], "Europe/Stockholm"], // #16
    [[35.8722, -84.525], "America/New_York"], // #18
    [[60.0961, 18.797], "Europe/Stockholm"], // #23 (Grisslehamn)
    [[59.9942, 18.7794], "Europe/Stockholm"], // #23 (Ortala)
    [[59.05, 15.0412], "Europe/Stockholm"], // #23 (Tomta)
    [[60.027, 18.7594], "Europe/Stockholm"], // #23 (Björkkulla)
    [[60.0779, 18.8102], "Europe/Stockholm"], // #23 (Kvarnsand)
    [[60.0239, 18.7625], "Europe/Stockholm"], // #23 (Semmersby)
    [[59.9983, 18.8548], "Europe/Stockholm"], // #23 (Gamla Grisslehamn)
    [[37.3458, -85.3456], "America/New_York"], // #24
    [[46.4547, -90.1711], "America/Menominee"], // #25
    [[46.4814, -90.0531], "America/Menominee"], // #25
    [[46.4753, -89.94], "America/Menominee"], // #25
    [[46.3661, -89.5969], "America/Menominee"], // #25
    [[46.2678, -89.1781], "America/Menominee"], // #25
    [[45.1078, -87.6142], "America/Menominee"], // #25
    [[39.6217, -87.4522], "America/Indiana/Indianapolis"], // #27
    [[39.6631, -87.4307], "America/Indiana/Indianapolis"], // #27
    [[61.7132, 29.3968], "Europe/Helsinki"], // #36
    [[41.6724, -86.5082], "America/Indiana/Indianapolis"], // #38
    [[27.9881, 86.9253], "Asia/Shanghai"], // Mount Everest
    [[47.3525, -102.6214], "America/Denver"], // Dunn Center, North Dakota
    [[20.5104, -86.9493], "America/Cancun"], // #40 (San Miguel de Cozumel)
    [[19.5786, -88.0453], "America/Cancun"], // #40 (Felipe Carrillo Puerto)
    [[21.2333, -86.7333], "America/Cancun"], // #40 (Isla Mujeres)
    [[18.5036, -88.3053], "America/Cancun"], // #40 (Chetumal)
    [[21.1606, -86.8475], "America/Cancun"], // #40 (Cancún)
    [[19.75, -88.7], "America/Cancun"], // #40 (José María Morelos)
    [[21.1, -87.4833], "America/Cancun"], // #40 (Kantunilkín)
    [[20.6275, -87.0811], "America/Cancun"], // #40 (Playa del Carmen)
    [[20.2119, -87.4658], "America/Cancun"], // #40 (Tulum)
    [[18.6769, -88.3953], "America/Cancun"], // #40 (Bacalar)
    [[20.8536, -86.8753], "America/Cancun"], // #40 (Puerto Morelos)
    [[-31.675, 128.8831], "Australia/Eucla"], // # 45
    [[-31.9567, 141.4678], "Australia/Broken_Hill"], // #46
    [[54.71143, -7.707], "Europe/London"], // #47 (Northern Ireland)
    [[54.5916, -7.73399], "Europe/London"], // #47
    [[54.15168, -7.35706], "Europe/London"], // #47
    [[54.20568, -6.73835], "Europe/London"], // #47
    [[54.75062, -7.56082], "Europe/Dublin"], // #47 (Ireland)
    [[54.53679, -7.85138], "Europe/Dublin"], // #47
    [[54.29158, -7.87585], "Europe/Dublin"], // #47
    [[54.39447, -6.97871], "Europe/Dublin"], // #47
    [[54.07753, -6.67391], "Europe/Dublin"], // #47
    [[45.6504, -67.5789], "America/Moncton"], // #48
    [[46.4392, -67.7449], "America/Moncton"], // #48
    [[45.3238, -116.5487], "America/Boise"], // #51
    [[-37.3786, 140.8362], "Australia/Adelaide"], // #52
    [[44.6972, -67.3955], "America/New_York"], // #53
    [[67.9333, 23.4333], "Europe/Stockholm"], // #54
    [[67.8167, 23.1667], "Europe/Stockholm"], // #54
    [[68.1375, 23.1447], "Europe/Stockholm"], // #56 (Saivomuotka)
    [[67.8, 23.1133], "Europe/Stockholm"], // #56 (Muonionalusta)
    [[67.9458, 23.6242], "Europe/Stockholm"], // #56 (Muoniovaara)
    [[68.0168, 23.4515], "Europe/Stockholm"], // #56 (Ruosteranta)
    [[68.1133, 23.3214], "Europe/Stockholm"], // #56 (Kätkesuando)
    [[40.7084, -86.69554], "America/Indiana/Indianapolis"], // #59
    [[41.0523, -86.70629], "America/Indiana/Winamac"], // #59
    [[29.54747, 34.947252], "Asia/Jerusalem"], // Eilat

    // Check that we resolve conflicting zones adequately.
    [[43.825, 87.6], "Asia/Urumqi"],
    [[25.0667, 121.5167], "Asia/Taipei"],

    // Collapse the north pole so that it always returns GMT regardless of the
    // longitude.
    [[90, -180], "Etc/GMT", "Etc/GMT-12"], // #20 // TODO FIXME: geo-tz says Etc/GMT+12
    [[90, -90], "Etc/GMT", "Etc/GMT-12"], // #20
    [[90, 0], "Etc/GMT", "Etc/GMT-12"], // #20
    [[90, 90], "Etc/GMT", "Etc/GMT-12"], // #20
    [[90, 180], "Etc/GMT", "Etc/GMT-12"], // #20

    // Sanity-check international waters.
    [[-56.25, -180], "Etc/GMT+12"],
    [[-56.25, -165], "Etc/GMT+11"],
    [[-56.25, -150], "Etc/GMT+10"],
    [[-56.25, -135], "Etc/GMT+9"],
    [[-56.25, -120], "Etc/GMT+8"],
    [[-56.25, -105], "Etc/GMT+7"],
    [[-56.25, -90], "Etc/GMT+6"],
    // NOTE: No large areas of GMT+5 are present on the map due to compression.
    [[26.25, -60], "Etc/GMT+4"],
    [[-48.75, -45], "Etc/GMT+3"],
    [[-48.75, -30], "Etc/GMT+2"],
    [[-56.25, -15], "Etc/GMT+1"],
    [[-56.25, 0], "Etc/GMT"],
    [[-56.25, 15], "Etc/GMT-1"],
    [[-56.25, 30], "Etc/GMT-2"],
    [[-56.25, 45], "Etc/GMT-3"],
    [[-56.25, 60], "Etc/GMT-4"],
    [[-56.25, 75], "Etc/GMT-5"],
    [[-56.25, 90], "Etc/GMT-6"],
    [[-56.25, 105], "Etc/GMT-7"],
    [[-56.25, 120], "Etc/GMT-8"],
    [[-56.25, 135], "Etc/GMT-9"],
    [[-56.25, 150], "Etc/GMT-10"],
    [[-48.75, 165], "Etc/GMT-11"],
    [[-56.25, 180], "Etc/GMT-12", "Etc/GMT+12"],

    // Strings should be allowed.
    [["42.3668", "-71.0546"], "America/New_York"],
    [["21.4381", "-158.0493"], "Pacific/Honolulu"],

    // These are automatically-generated test-cases just so I can be
    // confident when I change the data storage format all around.
    [[37.8358, -89.0556], "America/Chicago"],
    [[-29.3372, -56.9745], "America/Argentina/Cordoba"],
    [[82.3141, -39.1331], "America/Nuuk"],
    [[54.1241, 95.1606], "Asia/Krasnoyarsk"],
    [[-3.6445, 24.5964], "Africa/Lubumbashi"],
    [[21.92, 76.3888], "Asia/Kolkata"],
    [[81.0433, -78.2488], "America/Iqaluit"],
    [[41.4793, -2.7493], "Europe/Madrid"],
    [[16.5041, 103.0204], "Asia/Bangkok"],
    [[72.475, -122.6775], "America/Inuvik"],
    [[20.2716, 28.7996], "Africa/Khartoum"],
    [[-18.6123, 137.446], "Australia/Darwin"],
    [[57.0724, 104.8747], "Asia/Irkutsk"],
    [[30.4075, 113.4049], "Asia/Shanghai"],
    [[67.9909, 164.1215], "Asia/Anadyr"],
    [[30.7623, -84.098], "America/New_York"],
    [[1.9845, 100.4508], "Asia/Jakarta"],
    [[69.3563, -39.2451], "America/Nuuk"],
    [[16.1784, 106.2894], "Asia/Vientiane"],
    [[22.1635, -84.3358], "America/Havana"],
    [[65.914, -70.596], "America/Iqaluit"],
    [[69.8885, -107.6005], "America/Cambridge_Bay"],
    [[39.2287, 32.3653], "Europe/Istanbul"],
    [[65.9913, 43.2401], "Europe/Moscow"],
    [[-31.3366, -57.4872], "America/Montevideo"],
    [[67.7696, 158.2245], "Asia/Srednekolymsk"],
    [[65.8424, -52.6658], "America/Nuuk"],
    [[38.8582, -78.975], "America/New_York"],
    [[-27.8742, 146.6473], "Australia/Brisbane"],
    [[45.9379, 62.7043], "Asia/Qyzylorda"],
    [[64.3534, 73.2775], "Asia/Yekaterinburg"],
    [[29.9944, -99.8165], "America/Chicago"],
    [[29.1503, 23.8957], "Africa/Tripoli"],
    [[54.5334, 92.8278], "Asia/Krasnoyarsk"],
    [[64.979, -41.9666], "America/Nuuk"],
    [[-17.2287, 33.9961], "Africa/Maputo"],
    [[68.3552, -149.0941], "America/Anchorage"],
    [[40.8713, 86.7712], "Asia/Urumqi"],
    [[58.9104, -108.2242], "America/Regina"],
    [[63.9166, 56.0705], "Europe/Moscow"],
    [[54.7639, 41.9429], "Europe/Moscow"],
    [[81.8413, -73.2339], "America/Iqaluit"],
    [[-2.1921, 10.6367], "Africa/Libreville"],
    [[9.5718, -83.1948], "America/Costa_Rica"],
    [[11.9618, -71.7086], "America/Bogota"],
    [[65.5352, 74.4143], "Asia/Yekaterinburg"],
    [[50.5575, -93.9996], "America/Winnipeg"],
    [[51.674, 157.0986], "Asia/Kamchatka"],
    [[46.7376, 142.8907], "Asia/Sakhalin"],
    [[37.5756, 120.5804], "Asia/Shanghai"],
    [[32.7113, 74.3851], "Asia/Karachi"],
    [[-24.4658, -55.826], "America/Asuncion"],
    [[24.1446, 113.9533], "Asia/Shanghai"],
    [[46.8222, -114.0462], "America/Denver"],
    [[60.6475, 66.0918], "Asia/Yekaterinburg"],
    [[64.5038, -75.816], "America/Iqaluit"],
    [[61.4801, 57.7244], "Asia/Yekaterinburg"],
    [[62.5267, 96.4454], "Asia/Krasnoyarsk"],
    [[-25.1877, 139.8115], "Australia/Brisbane"],
    [[13.6274, 99.6599], "Asia/Bangkok"],
    [[-9.6665, -43.4782], "America/Bahia"],
    [[17.5016, -8.071], "Africa/Nouakchott"],
    [[64.1965, -116.9276], "America/Edmonton"],
    [[74.0116, -35.9084], "America/Nuuk"],
    [[28.1819, 47.1326], "Asia/Riyadh"],
    [[-25.8522, 139.7641], "Australia/Brisbane"],
    [[55.1606, 80.3125], "Asia/Novosibirsk"],
    [[58.5365, -99.8847], "America/Winnipeg"],
    [[19.0721, -0.7923], "Africa/Bamako"],
    [[51.7151, 84.7338], "Asia/Barnaul"],
    [[23.2615, 76.4792], "Asia/Kolkata"],
    [[46.726, 79.0294], "Asia/Almaty"],
    [[54.2007, -121.4509], "America/Vancouver"],
    [[57.9166, 96.0225], "Asia/Krasnoyarsk"],
    [[19.8781, 9.802], "Africa/Niamey"],
    [[65.034, -155.4731], "America/Anchorage"],
    [[21.2294, 102.3456], "Asia/Vientiane"],
    [[14.6321, 74.8661], "Asia/Kolkata"],
    [[73.9279, 56.0125], "Europe/Moscow"],
    [[61.0509, 79.4277], "Asia/Yekaterinburg"],
    [[-5.8263, -38.5891], "America/Fortaleza"],
    [[66.1051, -44.2991], "America/Nuuk"],
    [[61.972, -122.8406], "America/Inuvik"],
    [[50.7092, 98.1654], "Asia/Ulaanbaatar"],
    [[42.7892, -80.2958], "America/Toronto"],
    [[20.1117, 53.8416], "Asia/Riyadh"],
    [[66.7761, 148.5291], "Asia/Srednekolymsk"],
    [[-5.3391, 16.3601], "Africa/Kinshasa"],
    [[27.3337, 40.2867], "Asia/Riyadh"],
    [[19.2194, 19.0398], "Africa/Ndjamena"],
    [[5.0789, 34.1745], "Africa/Juba"],
    [[-0.9584, -49.4351], "America/Belem"],
    [[57.1181, 69.5137], "Asia/Yekaterinburg"],
    [[9.0181, 27.4099], "Africa/Juba"],
    [[11.9072, 13.9995], "Africa/Lagos"],
    [[30.0807, -93.3324], "America/Chicago"],
    [[-23.3847, -56.5457], "America/Asuncion"],
    [[39.8811, 26.3869], "Europe/Istanbul"],
    [[69.0819, 49.1753], "Europe/Moscow"],
    [[29.1968, 58.7977], "Asia/Tehran"],
    [[26.3241, -11.186], "Africa/El_Aaiun"],
    [[74.5094, -46.1125], "America/Nuuk"],
    [[-18.0039, 137.1668], "Australia/Darwin"],
    [[3.1497, -63.051], "America/Boa_Vista"],
    [[48.6762, 79.7838], "Asia/Almaty"],
    [[59.6321, 35.7763], "Europe/Moscow"],
    [[31.9457, -89.0334], "America/Chicago"],
    [[45.4515, -66.2694], "America/Moncton"],
    [[45.3159, 74.4388], "Asia/Almaty"],
    [[22.9471, 71.5664], "Asia/Kolkata"],
    [[39.4891, 29.9276], "Europe/Istanbul"],
    [[69.5459, -40.9566], "America/Nuuk"],
    [[-25.1121, -56.3599], "America/Asuncion"],
    [[58.6718, 71.7465], "Asia/Yekaterinburg"],
    [[38.7813, -105.5734], "America/Denver"],
    [[53.445, 25.5964], "Europe/Minsk"],
    [[64.6617, 160.8968], "Asia/Magadan"],
    [[61.6405, 69.4836], "Asia/Yekaterinburg"],
    [[-12.9104, 36.1809], "Africa/Maputo"],
    [[52.5127, -65.5284], "America/Goose_Bay"],
    [[41.9794, -93.6538], "America/Chicago"],
    [[59.375, 40.2467], "Europe/Moscow"],
    [[-6.1405, 27.0324], "Africa/Lubumbashi"],
    [[28.0069, 27.9217], "Africa/Cairo"],
    [[17.5589, 82.9606], "Asia/Kolkata"],
    [[77.007, -58.1725], "America/Nuuk"],
    [[25.1439, 50.4092], "Asia/Riyadh"],
    [[13.5243, 26.5038], "Africa/Khartoum"],
    [[-19.5728, 134.177], "Australia/Darwin"],
    [[37.7332, -116.5272], "America/Los_Angeles"],
    [[-30.6651, 120.3113], "Australia/Perth"],
    [[74.6277, -33.171], "America/Nuuk"],
    [[53.6035, -97.5722], "America/Winnipeg"],
    [[55.5158, 58.6481], "Asia/Yekaterinburg"],
    [[-10.3277, 38.6084], "Africa/Dar_es_Salaam"],
    [[34.756, 44.4394], "Asia/Baghdad"],
    [[62.6169, 103.2882], "Asia/Krasnoyarsk"],
    [[-2.6981, -73.2412], "America/Lima"],
    [[-4.9274, -65.3226], "America/Manaus"],
    [[71.1648, -117.7618], "America/Edmonton"],
    [[58.5594, 34.6095], "Europe/Moscow"],
    [[55.2956, 32.0908], "Europe/Moscow"],
    [[-15.3693, 36.535], "Africa/Maputo"],
    [[-19.4016, 47.3511], "Indian/Antananarivo"],
    [[23.3162, 12.8176], "Africa/Niamey"],
    [[41.4247, 121.1758], "Asia/Shanghai"],
    [[49.0067, 17.4505], "Europe/Prague"],
    [[-22.7467, 130.6468], "Australia/Darwin"],
    [[63.8349, 152.536], "Asia/Magadan"],
    [[-20.7583, 120.757], "Australia/Perth"],
    [[62.7709, -118.4994], "America/Edmonton"],
    [[21.263, 17.5662], "Africa/Ndjamena"],
    [[63.7417, -115.2235], "America/Edmonton"],
    [[81.6018, -59.8101], "America/Nuuk"],
    [[-38.1635, -57.7626], "America/Argentina/Buenos_Aires"],
    [[36.197, -107.8392], "America/Denver"],
    [[26.0985, -105.9614], "America/Monterrey"],
    [[32.3567, 113.1371], "Asia/Shanghai"],
    [[27.4785, 48.7596], "Asia/Riyadh"],
    [[41.5358, 69.834], "Asia/Tashkent"],
    [[-31.7125, -60.6771], "America/Argentina/Cordoba"],
    [[55.3174, -111.7919], "America/Edmonton"],
    [[23.4918, -4.6733], "Africa/Bamako"],
    [[23.467, 42.9883], "Asia/Riyadh"],
    [[64.0877, 20.1457], "Europe/Stockholm"],
    [[73.5927, -115.9105], "America/Edmonton"],
    [[51.8279, -84.3882], "America/Toronto"],
    [[56.5034, -108.7968], "America/Regina"],
    [[55.2477, 64.4429], "Asia/Yekaterinburg"],
    [[79.9054, -80.5558], "America/Iqaluit"],
    [[68.1178, 137.7878], "Asia/Vladivostok"],
    [[75.4235, 140.6829], "Asia/Yakutsk"],
    [[25.1553, 30.5491], "Africa/Cairo"],
    [[57.5382, 69.7678], "Asia/Yekaterinburg"],
    [[19.2966, 13.2915], "Africa/Niamey"],
    [[-29.33, -51.9941], "America/Sao_Paulo"],
    [[68.4663, 137.8967], "Asia/Vladivostok"],
    [[65.0498, 43.3195], "Europe/Moscow"],
    [[56.5933, 91.5732], "Asia/Krasnoyarsk"],
    [[63.4242, 153.957], "Asia/Magadan"],
    [[60.5414, 102.283], "Asia/Krasnoyarsk"],
    [[78.2319, -35.9009], "America/Nuuk"],
    [[50.4043, 20.1115], "Europe/Warsaw"],
    [[67.7007, -139.1173], "America/Dawson"],
    [[46.7656, 96.6875], "Asia/Ulaanbaatar"],
    [[-22.5825, 29.4276], "Africa/Johannesburg"],
    [[59.9827, 92.8622], "Asia/Krasnoyarsk"],
    [[32.2351, 74.7128], "Asia/Karachi"],
    [[81.5336, -86.4839], "America/Rankin_Inlet"],
    [[77.1564, -25.3151], "America/Nuuk"],
    [[40.7495, 34.3622], "Europe/Istanbul"],
    [[-12.6167, -54.5727], "America/Cuiaba"],
    [[26.5547, -100.3505], "America/Monterrey"],
    [[43.4997, 118.0167], "Asia/Shanghai"],
    [[48.2616, 20.3343], "Europe/Budapest"],
    [[44.7708, 44.7429], "Europe/Moscow"],
    [[48.3448, 108.2238], "Asia/Ulaanbaatar"],
    [[54.1347, -123.4773], "America/Vancouver"],
    [[37.1042, -8.4274], "Europe/Lisbon"],
    [[79.8894, 17.3457], "Arctic/Longyearbyen"],
    [[63.2507, -46.7969], "America/Nuuk"],
    [[-1.9246, 29.0612], "Africa/Lubumbashi"],
    [[-12.3557, -53.4448], "America/Cuiaba"],
    [[-27.3542, -49.118], "America/Sao_Paulo"],
    [[62.9927, 24.749], "Europe/Helsinki"],
    [[76.0195, -49.4057], "America/Nuuk"],
    [[14.1445, 3.7444], "Africa/Niamey"],
    [[14.4858, 19.3595], "Africa/Ndjamena"],
    [[8.5186, 11.5768], "Africa/Lagos"],
    [[16.1586, 51.0247], "Asia/Aden"],
    [[56.5211, 46.9765], "Europe/Moscow"],
    [[-0.8225, 122.7093], "Asia/Makassar"],
    [[71.7943, 142.9243], "Asia/Vladivostok"],
    [[53.48, 102.6862], "Asia/Irkutsk"],
    [[54.4724, 35.8859], "Europe/Moscow"],
    [[42.6423, 47.3439], "Europe/Moscow"],
    [[21.3766, -9.0809], "Africa/Nouakchott"],
    [[15.3113, 32.8385], "Africa/Khartoum"],
    [[-0.9303, -61.542], "America/Manaus"],
    [[61.4208, 165.6336], "Asia/Kamchatka"],
    [[31.599, 110.1621], "Asia/Shanghai"],
    [[-25.9807, 26.93], "Africa/Johannesburg"],
    [[61.7306, -48.6246], "America/Nuuk"],
    [[64.2152, 124.0541], "Asia/Yakutsk"],
    [[-46.1385, -72.9657], "America/Coyhaique"], // Changed from America/Santiago 2025b
    [[15.8589, 24.5199], "Africa/Khartoum"],
    [[56.0054, 60.8903], "Asia/Yekaterinburg"],
    [[61.4232, -131.4265], "America/Whitehorse"],
    [[60.1848, -122.0054], "America/Inuvik"],
    [[51.5442, -105.1728], "America/Regina"],
    [[43.8244, -96.618], "America/Chicago"],
    [[62.6568, 77.4446], "Asia/Yekaterinburg"],
    [[72.0346, -32.6102], "America/Nuuk"],
    [[14.0688, -13.6619], "Africa/Dakar"],
    [[79.5181, -25.8663], "America/Nuuk"],
    [[59.824, 37.2919], "Europe/Moscow"],
    [[9.1754, -76.0658], "America/Bogota"],
    [[-3.3148, 38.7519], "Africa/Nairobi"],
    [[-30.839, -61.0529], "America/Argentina/Cordoba"],
    [[77.3716, -56.528], "America/Nuuk"],
    [[25.4612, 16.3495], "Africa/Tripoli"],
    [[49.2977, -125.2356], "America/Vancouver"],
    [[18.4695, 27.3104], "Africa/Khartoum"],
    [[65.4723, 167.7756], "Asia/Anadyr"],
    [[53.0989, 40.2981], "Europe/Moscow"],
    [[46.0498, -119.7057], "America/Los_Angeles"],
    [[33.4187, 40.2683], "Asia/Baghdad"],
    [[46.6549, 33.7897], "Europe/Kyiv"],
    [[67.5675, 115.0571], "Asia/Yakutsk"],
    [[54.214, 45.7523], "Europe/Moscow"],
    [[-15.4168, 27.5488], "Africa/Lusaka"],
    [[72.0585, 94.0572], "Asia/Krasnoyarsk"],
    [[43.7057, -79.6802], "America/Toronto"],
    [[68.7574, 27.1326], "Europe/Helsinki"],
    [[47.9892, 138.5052], "Asia/Vladivostok"],
    [[49.5039, 106.2301], "Asia/Ulaanbaatar"],
    [[47.125, 86.2943], "Asia/Urumqi"],
    [[-30.7504, -65.1035], "America/Argentina/Cordoba"],
    [[73.0064, 98.4606], "Asia/Krasnoyarsk"],
    [[72.92, -53.842], "America/Nuuk"],
    [[33.954, -84.6719], "America/New_York"],
    [[70.2102, 109.2729], "Asia/Krasnoyarsk"],
    [[14.5076, 76.2365], "Asia/Kolkata"],
    [[29.1668, 28.7916], "Africa/Cairo"],
    [[-6.341, 16.0039], "Africa/Luanda"],
    [[15.7965, 18.3872], "Africa/Ndjamena"],
    [[-7.7214, 140.518], "Asia/Jayapura"],
    [[23.8358, 14.1805], "Africa/Tripoli"],
    [[56.1999, 114.3054], "Asia/Irkutsk"],
    [[40.6756, -3.1529], "Europe/Madrid"],
    [[46.6208, -110.5776], "America/Denver"],
    [[33.8164, -4.3187], "Africa/Casablanca"],
    [[19.4155, -70.3931], "America/Santo_Domingo"],
    [[63.9662, 27.2907], "Europe/Helsinki"],
    [[30.4291, -7.3296], "Africa/Casablanca"],
    [[-12.6378, -57.5], "America/Cuiaba"],
    [[-3.9646, -73.4212], "America/Lima"],
    [[-18.8768, 123.5026], "Australia/Perth"],
    [[-3.2149, -60.7691], "America/Manaus"],
    [[56.0306, 96.2819], "Asia/Krasnoyarsk"],
    [[61.3456, -154.6022], "America/Anchorage"],
    [[17.0363, 80.1072], "Asia/Kolkata"],
    [[32.98, -84.4394], "America/New_York"],
    [[69.7465, 88.1611], "Asia/Krasnoyarsk"],
    [[-24.7776, 133.3335], "Australia/Darwin"],
    [[52.2638, 23.4595], "Europe/Minsk"],
    [[6.0803, 33.7236], "Africa/Juba"],
    [[46.2339, 118.3615], "Asia/Shanghai"],
    [[-31.8517, 19.9454], "Africa/Johannesburg"],
    [[28.4657, 110.0877], "Asia/Shanghai"],
    [[40.1297, 63.6307], "Asia/Samarkand"],
    [[-19.1731, 14.5112], "Africa/Windhoek"],
    [[56.6561, 54.9217], "Asia/Yekaterinburg"],
    [[48.5194, 62.6996], "Asia/Aqtobe"],
    [[15.0813, 102.2842], "Asia/Bangkok"],
    [[-2.9155, 104.5851], "Asia/Jakarta"],
    [[20.8734, 13.1134], "Africa/Niamey"],
    [[30.7539, 4.9642], "Africa/Algiers"],
    [[51.2865, 121.6765], "Asia/Shanghai"],
    [[18.4527, 3.08], "Africa/Bamako"],
    [[-12.9176, -51.8294], "America/Cuiaba"],
    [[-9.8941, 31.4986], "Africa/Lusaka"],
    [[51.1884, 72.5447], "Asia/Almaty"],
    [[50.172, 109.3305], "Asia/Chita"],
    [[31.6023, -81.5271], "America/New_York"],
    [[-34.9033, -64.2808], "America/Argentina/Cordoba"],
    [[11.914, -1.7697], "Africa/Ouagadougou"],
    [[25.2369, 115.3962], "Asia/Shanghai"],
    [[68.421, 152.269], "Asia/Srednekolymsk"],
    [[46.9954, 102.2327], "Asia/Ulaanbaatar"],
    [[7.5015, 41.0239], "Africa/Addis_Ababa"],
    [[49.8186, 90.284], "Asia/Hovd"],
    [[56.558, -104.9026], "America/Regina"],
    [[1.3163, -70.7942], "America/Bogota"],
    [[-15.0202, 127.2482], "Australia/Perth"],
    [[20.7633, 3.2933], "Africa/Algiers"],
    [[58.7958, 56.715], "Asia/Yekaterinburg"],
    [[57.3421, -98.0511], "America/Winnipeg"],
    [[3.6109, -73.4326], "America/Bogota"],
    [[6.3923, -6.7531], "Africa/Abidjan"],
    [[31.3301, 60.7153], "Asia/Tehran"],
    [[50.3759, 7.5712], "Europe/Berlin"],
    [[1.7587, 34.0083], "Africa/Kampala"],
    [[-26.7159, 149.7563], "Australia/Brisbane"],
    [[44.2626, 44.7455], "Europe/Moscow"],
    [[59.8934, -129.006], "America/Vancouver"],
    [[-0.6722, -77.7137], "America/Guayaquil"],
    [[45.327, -111.0269], "America/Denver"],
    [[-21.4916, 18.2277], "Africa/Windhoek"],
    [[69.8075, -36.7877], "America/Nuuk"],
    [[62.4056, 40.1308], "Europe/Moscow"],
    [[35.678, -85.8903], "America/Chicago"],
    [[-5.2175, -55.5735], "America/Santarem"],
    [[19.3533, 73.4849], "Asia/Kolkata"],
    [[69.7972, -50.0355], "America/Nuuk"],
    [[14.7315, 20.6226], "Africa/Ndjamena"],
    [[-11.9026, 19.1156], "Africa/Luanda"],
    [[-19.0649, -52.4491], "America/Campo_Grande"],
    [[61.3513, -148.3128], "America/Anchorage"],
    [[73.8546, -120.2774], "America/Inuvik"],
    [[69.4978, 156.2309], "Asia/Srednekolymsk"],
    [[23.2705, 87.0558], "Asia/Kolkata"],
    [[15.9273, -92.0672], "America/Mexico_City"],
    [[67.4221, -51.8146], "America/Nuuk"],
    [[-20.2422, -40.7203], "America/Sao_Paulo"],
    [[14.8675, 76.3773], "Asia/Kolkata"],
    [[-26.1632, 16.0042], "Africa/Windhoek"],
    [[65.1068, -87.7971], "America/Rankin_Inlet"],
    [[-1.2604, 17.7737], "Africa/Kinshasa"],
    [[26.2379, 12.8011], "Africa/Tripoli"],
    [[33.2165, 114.4249], "Asia/Shanghai"],
    [[1.5147, 116.9022], "Asia/Makassar"],
    [[21.2209, 54.6444], "Asia/Riyadh"],
    [[-18.5604, 13.7071], "Africa/Windhoek"],
    [[73.3086, -50.3401], "America/Nuuk"],
    [[66.0904, 141.2401], "Asia/Srednekolymsk"],
    [[57.5957, 83.779], "Asia/Tomsk"],
    [[62.4294, -160.5397], "America/Anchorage"],
    [[5.2829, 35.5583], "Africa/Juba"],
    [[49.7176, -120.6521], "America/Vancouver"],
    [[25.6025, -99.0005], "America/Monterrey"],
    [[67.5031, -38.0278], "America/Nuuk"],
    [[43.4929, 78.0778], "Asia/Almaty"],
    [[58.7754, -120.0701], "America/Fort_Nelson"],
    [[60.8634, -131.1674], "America/Whitehorse"],
    [[-2.3241, -65.9156], "America/Manaus"],
    [[51.2849, 31.5151], "Europe/Kyiv"],
    [[-0.6626, 17.8965], "Africa/Kinshasa"],
    [[73.2245, -96.8935], "America/Rankin_Inlet"],
    [[32.3177, 46.9431], "Asia/Baghdad"],
    [[43.5323, 65.9852], "Asia/Qyzylorda"],
    [[21.9848, -79.4824], "America/Havana"],
    [[3.1742, 29.6364], "Africa/Lubumbashi"],
    [[45.4705, 135.6598], "Asia/Vladivostok"],
    [[52.9221, 101.7918], "Asia/Irkutsk"],
    [[18.1641, 18.4528], "Africa/Ndjamena"],
    [[8.6146, -65.2355], "America/Caracas"],
    [[-6.6831, 22.1025], "Africa/Lubumbashi"],
    [[64.1049, 89.7467], "Asia/Krasnoyarsk"],
    [[-28.188, 119.3906], "Australia/Perth"],
    [[-23.5594, 142.2289], "Australia/Brisbane"],
    [[22.4934, -12.2664], "Africa/Nouakchott"],
    [[17.1192, -12.8761], "Africa/Nouakchott"],
    [[51.4541, 43.3003], "Europe/Saratov"],
    [[15.1609, 76.2168], "Asia/Kolkata"],
    [[60.0202, 89.4423], "Asia/Krasnoyarsk"],
    [[41.8693, -5.9326], "Europe/Madrid"],
    [[4.2187, -62.7399], "America/Caracas"],
    [[69.5304, 85.2865], "Asia/Krasnoyarsk"],
    [[36.6934, 113.5059], "Asia/Shanghai"],
    [[17.448, 49.6467], "Asia/Aden"],
    [[71.4531, -46.1878], "America/Nuuk"],
    [[14.5328, 20.0108], "Africa/Ndjamena"],
    [[49.0779, 105.261], "Asia/Ulaanbaatar"],
    [[-10.726, -66.9046], "America/La_Paz"],
    [[31.2644, 21.7824], "Africa/Tripoli"],
    [[57.2329, 94.6034], "Asia/Krasnoyarsk"],
    [[12.6608, -87.243], "America/Managua"],
    [[63.4155, -109.7556], "America/Edmonton"],
    [[41.8814, -113.9326], "America/Denver"],
    [[8.1392, 80.1801], "Asia/Colombo"],
    [[53.9195, 107.1539], "Asia/Irkutsk"],
    [[29.5765, 28.8024], "Africa/Cairo"],
    [[75.7569, -40.291], "America/Nuuk"],
    [[54.6688, -115.0705], "America/Edmonton"],
    [[-8.8954, -38.3336], "America/Recife"],
    [[67.2404, 94.0746], "Asia/Krasnoyarsk"],
    [[73.9764, 56.1288], "Europe/Moscow"],
    [[58.4602, 25.1753], "Europe/Tallinn"],
    [[28.7239, 27.2395], "Africa/Cairo"],
    [[75.2983, 99.6727], "Asia/Krasnoyarsk"],
    [[62.7501, -152.6146], "America/Anchorage"],
    [[19.8008, 1.9334], "Africa/Bamako"],
    [[33.1982, 83.0222], "Asia/Shanghai"],
    [[67.8631, 37.3873], "Europe/Moscow"],
    [[75.9975, 58.214], "Europe/Moscow"],
    [[25.9586, 86.2132], "Asia/Kolkata"],
    [[25.7531, 103.4546], "Asia/Shanghai"],
    [[-1.2608, 98.7578], "Asia/Jakarta"],
    [[49.3192, 80.5804], "Asia/Almaty"],
    [[-79.0132, 81.396], "Antarctica/Davis"],
    [[-73.0967, 106.987], "Antarctica/Vostok"],
    [[77.0111, -120.2982], "America/Inuvik"],
    [[-73.4287, 5.4364], "Antarctica/Troll"],
    [[-66.5058, 64.0729], "Antarctica/Mawson"],
    [[39.0869, -107.1701], "America/Denver"],
    [[-13.529, 14.8057], "Africa/Luanda"],
    [[16.9259, 23.4079], "Africa/Ndjamena"],
    [[20.5368, -104.0424], "America/Mexico_City"],
    [[-81.7696, 20.3269], "Antarctica/Troll"],
    [[-89.6943, -12.8332], "Antarctica/McMurdo"],
    [[56.6457, 114.3333], "Asia/Irkutsk"],
    [[20.5973, -89.5332], "America/Merida"],
    [[71.9162, 100.4965], "Asia/Krasnoyarsk"],
    [[-66.3355, -77.7903], "Antarctica/Rothera"],
    [[-26.4973, 138.5763], "Australia/Adelaide"],
    [[-35.3391, -64.4822], "America/Argentina/Salta"],
    [[16.771, 14.2184], "Africa/Niamey"],
    [[49.2696, -56.1093], "America/St_Johns"],
    [[49.0344, 84.2924], "Asia/Almaty"],
    [[60.7068, 45.8371], "Europe/Moscow"],
    [[55.4593, 78.5289], "Asia/Novosibirsk"],
    [[50.0907, 41.2256], "Europe/Moscow"],
    [[-23.8993, 127.959], "Australia/Perth"],
    [[-80.8724, -167.2751], "Antarctica/McMurdo"],
    [[-75.592, -37.6688], "America/Argentina/Ushuaia"],
    [[66.327, 94.6674], "Asia/Krasnoyarsk"],
    [[-88.3632, 98.6259], "Antarctica/McMurdo"],
    [[2.1281, 117.6355], "Asia/Makassar"],
    [[66.8502, 138.7311], "Asia/Vladivostok"],
    [[-83.4419, 6.9384], "Antarctica/Troll"],
    [[3.0615, 98.6205], "Asia/Jakarta"],
    [[-70.951, 48.425], "Antarctica/Syowa"],
    [[70.3516, -45.0516], "America/Nuuk"],
    [[-10.6192, -138.6741], "Pacific/Marquesas"],
    [[75.4933, 106.0345], "Asia/Krasnoyarsk"],
    [[-44.4512, 171.2363], "Pacific/Auckland"],
    [[67.2609, 78.983], "Asia/Yekaterinburg"],
    [[-78.0195, 131.0572], "Australia/Perth"],
    [[68.4963, 114.0498], "Asia/Yakutsk"],
    [[67.441, -34.9892], "America/Nuuk"],
    [[73.0302, -99.5839], "America/Cambridge_Bay"],
    [[70.5563, -120.2147], "America/Inuvik"],
    [[65.5479, -144.2437], "America/Anchorage"],
    [[-85.8659, 45.0898], "Antarctica/Syowa"],
    [[74.7574, -80.1124], "America/Iqaluit"],
    [[-76.8354, 58.492], "Antarctica/Mawson"],
    [[1.289, 17.3546], "Africa/Brazzaville"],
    [[-71.3226, 77.5947], "Antarctica/Davis"],
    [[-68.1205, 35.8346], "Antarctica/Syowa"],
    [[6.7925, 22.9743], "Africa/Bangui"],
    [[51.1287, -112.4268], "America/Edmonton"],
    [[64.4173, 164.4698], "Asia/Kamchatka"],
    [[23.8292, 70.2438], "Asia/Kolkata"],
    [[29.5603, 89.499], "Asia/Shanghai"],
    [[-84.1417, 47.7183], "Antarctica/Syowa"],
    [[67.9214, -131.6255], "America/Inuvik"],
    [[48.8324, 128.5311], "Asia/Shanghai"],
    [[25.779, 74.2823], "Asia/Kolkata"],
    [[-86.0345, -170.6664], "Antarctica/McMurdo"],
    [[45.6175, 121.6184], "Asia/Shanghai"],
    [[41.7403, 20.8276], "Europe/Skopje"],
    [[14.8663, 50.1712], "Asia/Aden"],
    [[82.9035, -22.3043], "America/Nuuk"],
    [[-16.8805, 19.083], "Africa/Luanda"],
    [[53.083, 19.8285], "Europe/Warsaw"],
    [[64.4828, 163.0586], "Asia/Magadan"],
    [[-66.5045, 38.3691], "Antarctica/Syowa"],
    [[43.0496, 133.5702], "Asia/Vladivostok"],
    [[80.9508, 53.3216], "Europe/Moscow"],
    [[59.2654, 151.5864], "Asia/Magadan"],
    [[-73.6684, 55.12], "Antarctica/Mawson"],
    [[-88.8064, 3.5752], "Antarctica/McMurdo"],
    [[30.3355, -86.1421], "America/Chicago"],
    [[-21.2728, 148.8084], "Australia/Brisbane"],
    [[-78.8702, -46.8269], "America/Argentina/Ushuaia"],
    [[59.4444, -90.6225], "America/Rankin_Inlet"],
    [[71.0255, 106.5785], "Asia/Krasnoyarsk"],
    [[-86.5185, 15.9546], "Antarctica/McMurdo"],
    [[62.2638, 158.4123], "Asia/Magadan"],
    [[16.2712, 79.9924], "Asia/Kolkata"],
    [[25.9946, -111.1193], "America/Mazatlan"],
    [[67.3593, 170.8173], "Asia/Anadyr"],
    [[-41.1097, -69.1305], "America/Argentina/Salta"],
    [[50.9388, 109.4068], "Asia/Chita"],
    [[61.8463, 132.084], "Asia/Yakutsk"],
    [[76.0938, -91.2822], "America/Rankin_Inlet"],
    [[-68.8721, 135.7162], "Antarctica/DumontDUrville"],
    [[-89.9582, -52.3598], "Antarctica/McMurdo"],
    [[66.7814, 127.3539], "Asia/Yakutsk"],
    [[43.8629, 25.1506], "Europe/Bucharest"],
    [[-70.2249, -77.9419], "Antarctica/Rothera"],
    [[25.9706, -0.9918], "Africa/Algiers"],
    [[-6.8331, 108.5842], "Asia/Jakarta"],
    [[32.6566, 67.2981], "Asia/Kabul"],
    [[31.6545, -83.1398], "America/New_York"],
    [[32.3307, 20.738], "Africa/Tripoli"],
    [[26.8859, -4.731], "Africa/Algiers"],
    [[72.1901, 73.7987], "Asia/Yekaterinburg"],
    [[61.4609, 6.1002], "Europe/Oslo"],
    [[44.7671, 52.5778], "Asia/Aqtau"],
    [[9.3837, 169.8606], "Pacific/Majuro"],
    [[-82.1506, -24.8995], "Antarctica/Rothera"],
    [[-86.0016, -97.4841], "Antarctica/McMurdo"],
    [[28.812, 40.8006], "Asia/Riyadh"],
    [[30.1001, -84.7572], "America/New_York"],
    [[38.0424, -98.1619], "America/Chicago"],
    [[46.4008, 64.8113], "Asia/Qyzylorda"],
    [[-42.608, -66.3404], "America/Argentina/Catamarca"],
    [[51.2942, -73.6949], "America/Toronto"],
    [[5.9748, 27.4505], "Africa/Juba"],
    [[38.7168, -109.489], "America/Denver"],
    [[-76.5392, 13.2635], "Antarctica/Troll"],
    [[80.759, -38.0482], "America/Nuuk"],
    [[61.242, 127.0076], "Asia/Yakutsk"],
    [[-71.3681, 71.7439], "Antarctica/Mawson"],
    [[24.374, 13.4214], "Africa/Tripoli"],
    [[-29.5255, -66.7115], "America/Argentina/La_Rioja"],
    [[53.0595, -63.1278], "America/Goose_Bay"],
    [[27.4545, 23.7945], "Africa/Tripoli"],
    [[70.6062, -116.7796], "America/Edmonton"],
    [[-78.0266, 89.5463], "Antarctica/Vostok"],
    [[-80.8097, 12.1054], "Antarctica/Troll"],
    [[-70.7923, 71.7077], "Antarctica/Mawson"],
    [[-31.3518, 20.5952], "Africa/Johannesburg"],
    [[-68.9786, 5.2261], "Antarctica/Troll"],
    [[-6.3637, 27.7118], "Africa/Lubumbashi"],
    [[18.4332, -6.6196], "Africa/Nouakchott"],
    [[-77.0248, 43.6335], "Antarctica/Syowa"],
    [[71.8116, -87.1942], "America/Rankin_Inlet"],
    [[70.457, 93.968], "Asia/Krasnoyarsk"],
    [[33.3829, -107.937], "America/Denver"],
    [[35.1988, 98.3263], "Asia/Shanghai"],
    [[42.6159, 42.9107], "Asia/Tbilisi"],
    [[0.322, -76.4236], "America/Bogota"],
    [[52.6912, 41.4685], "Europe/Moscow"],
    [[-12.5626, 39.8162], "Africa/Maputo"],
    [[-85.313, -164.1628], "Antarctica/McMurdo"],
    [[-68.7201, 57.8058], "Antarctica/Mawson"],
    [[68.3527, 131.2743], "Asia/Yakutsk"],
    [[-88.1516, -6.5469], "Antarctica/McMurdo"],
    [[62.261, 179.5525], "Asia/Anadyr"],
    [[-87.9052, 79.5652], "Antarctica/McMurdo"],
    [[-2.6852, -54.91], "America/Santarem"],
    [[58.9, -161.4623], "America/Anchorage"],
    [[24.5754, -97.8171], "America/Monterrey"],
    [[44.7316, 127.4951], "Asia/Shanghai"],
    [[-16.711, 139.2883], "Australia/Brisbane"],
    [[-24.0905, -52.6402], "America/Sao_Paulo"],
    [[20.512, 99.1082], "Asia/Yangon"],
    [[-8.6472, 151.2698], "Pacific/Port_Moresby"],
    [[-76.0947, 64.9489], "Antarctica/Mawson"],
    [[33.5917, 51.906], "Asia/Tehran"],
    [[71.2372, 101.1123], "Asia/Krasnoyarsk"],
    [[-5.0915, -57.2582], "America/Santarem"],
    [[65.3548, -96.8504], "America/Rankin_Inlet"],
    [[62.3472, 171.5791], "Asia/Anadyr"],
    [[-15.9366, -65.5134], "America/La_Paz"],
    [[79.7116, -58.1407], "America/Nuuk"],
    [[2.5708, -58.8395], "America/Guyana"],
    [[58.236, -96.7573], "America/Winnipeg"],
    [[-24.5029, 137.2922], "Australia/Darwin"],
    [[-87.4701, -169.542], "Antarctica/McMurdo"],
    [[65.5191, -48.489], "America/Nuuk"],
    [[47.0597, 100.9226], "Asia/Ulaanbaatar"],
    [[-13.8934, 23.9267], "Africa/Lusaka"],
    [[75.0357, -83.7869], "America/Iqaluit"],
    [[53.0031, 24.5531], "Europe/Minsk"],
    [[-79.9847, 4.4398], "Antarctica/Troll"],
    [[47.4082, 103.7547], "Asia/Ulaanbaatar"],
    [[58.7757, 81.0569], "Asia/Tomsk"],
    [[-79.0968, 21.8241], "Antarctica/Troll"],
    [[62.9556, 179.8271], "Asia/Anadyr"],
    [[51.5458, -95.6936], "America/Winnipeg"],
    [[-80.7504, 149.7052], "Australia/Perth"],
    [[80.0749, 23.5076], "Arctic/Longyearbyen"],
    [[72.9919, -48.7216], "America/Nuuk"],
    [[66.1858, -179.6058], "Asia/Anadyr"],
    [[49.0014, 15.9378], "Europe/Prague"],
    [[26.2018, -104.4062], "America/Monterrey"],
    [[-68.8304, 8.9564], "Antarctica/Troll"],
    [[-77.9243, -22.2413], "Antarctica/Rothera"],
    [[21.3038, 1.9522], "Africa/Algiers"],
    [[30.2715, 1.1909], "Africa/Algiers"],
    [[61.7867, 129.4369], "Asia/Yakutsk"],
    [[-2.7356, 121.3335], "Asia/Makassar"],
    [[-10.1536, 28.6716], "Africa/Lusaka"],
    [[64.468, 9.7399], "Europe/Oslo"],
    [[38.8564, 69.4276], "Asia/Dushanbe"],
    [[-86.7337, -91.8492], "Antarctica/McMurdo"],
    [[-67.1256, 80.3719], "Antarctica/Davis"],
    [[73.2005, -38.8907], "America/Nuuk"],
    [[68.3732, 79.3051], "Asia/Yekaterinburg"],
    [[-18.5228, 179.8736], "Pacific/Fiji"],
    [[57.7599, 95.4718], "Asia/Krasnoyarsk"],
    [[-69.4406, 39.3122], "Antarctica/Syowa"],
    [[4.454, 46.1925], "Africa/Mogadishu"],
    [[46.333, 35.649], "Europe/Kyiv"],
    [[18.0784, 94.5354], "Asia/Yangon"],
    [[42.0192, 14.5324], "Europe/Rome"],
    [[-0.5745, 126.283], "Asia/Jayapura"],
    [[-6.2976, -62.3238], "America/Manaus"],
    [[35.9614, -91.1373], "America/Chicago"],
    [[30.5783, 102.837], "Asia/Shanghai"],
    [[67.0065, -102.5618], "America/Cambridge_Bay"],
    [[64.0164, -121.9673], "America/Inuvik"],
    [[6.7059, 118.1856], "Asia/Manila"],
    [[-87.7733, -48.0], "Antarctica/McMurdo"],
    [[37.6582, 25.3762], "Europe/Athens", "Etc/GMT-2"],
    [[37.9909, 23.7208], "Europe/Athens"],
    [[22.2387, -79.7326], "America/Havana"],
    [[-81.8743, 167.102], "Antarctica/McMurdo"],
    [[-28.2237, 117.1222], "Australia/Perth"],
    [[69.5871, 63.0906], "Europe/Moscow"],
    [[-71.1373, -72.4565], "Antarctica/Rothera"],
    [[20.4689, 73.1744], "Asia/Kolkata"],
    [[-81.2806, 69.2614], "Antarctica/Mawson"],
    [[12.2423, 104.7141], "Asia/Phnom_Penh"],
    [[2.5316, 34.0752], "Africa/Kampala"],
    [[-69.0359, -75.1178], "Antarctica/Rothera"],
    [[61.1142, 17.3796], "Europe/Stockholm"],
    [[-32.8941, 124.3758], "Australia/Perth"],
    [[-3.568, 18.3166], "Africa/Kinshasa"],
    [[-28.6822, 127.0079], "Australia/Perth"],
    [[81.3302, 60.4397], "Europe/Moscow"],
    [[44.9839, 71.9443], "Asia/Almaty"],
    [[-70.6835, 9.4712], "Antarctica/Troll"],
    // [[77.4281, -22.5341], "America/Nuuk"], // this passed before geo-tz v8
    [[-21.5885, -48.6123], "America/Sao_Paulo"],
    [[-5.6724, 106.196], "Asia/Jakarta"],
    [[-8.7672, -68.7273], "America/Eirunepe"],
    [[22.4345, 5.206], "Africa/Algiers"],
    [[15.6843, 3.0316], "Africa/Bamako"],
    [[37.46, -110.5554], "America/Denver"],
    [[62.0256, 33.7515], "Europe/Moscow"],
    [[64.9079, 55.1102], "Europe/Moscow"],
    [[-15.7753, 133.2444], "Australia/Darwin"],
    [[-82.592, 71.7081], "Antarctica/Mawson"],
    [[79.7313, 91.7696], "Asia/Krasnoyarsk"],
    [[47.765, -77.4841], "America/Toronto"],
    [[-86.4348, 168.5435], "Antarctica/McMurdo"],
    [[28.7251, 1.9912], "Africa/Algiers"],
    [[-11.4494, 34.136], "Africa/Blantyre"],
    [[-79.0489, -55.611], "America/Argentina/Ushuaia"],
    [[70.3418, -104.1427], "America/Cambridge_Bay"],
    [[70.122, -90.4308], "America/Cambridge_Bay"],
    [[10.9729, 104.4684], "Asia/Phnom_Penh"],
    [[23.1465, 85.6926], "Asia/Kolkata"],
    [[79.2684, -76.192], "America/Iqaluit"],
    [[48.3757, 113.5456], "Asia/Ulaanbaatar"],
    [[60.9356, -92.9832], "America/Rankin_Inlet"],
    [[-22.592, -52.6535], "America/Sao_Paulo"],
    [[31.451, -87.0409], "America/Chicago"],
    [[32.2009, 57.4958], "Asia/Tehran"],
    [[43.122, -85.6895], "America/Detroit"],
    [[27.0485, -0.6853], "Africa/Algiers"],
    [[69.4291, 97.0373], "Asia/Krasnoyarsk"],
    [[76.0978, 83.7937], "Asia/Krasnoyarsk"],
    [[0.3519, -80.0219], "America/Guayaquil"],
    [[-28.982, -64.0333], "America/Argentina/Cordoba"],
    [[-86.5333, -3.0426], "Antarctica/McMurdo"],
    [[59.8418, 32.979], "Europe/Moscow"],
    [[59.7933, 18.9404], "Europe/Stockholm"],
    [[-15.8237, 17.5658], "Africa/Luanda"],
    [[-71.9451, 163.0158], "Antarctica/McMurdo"],
    [[67.4182, 147.8312], "Asia/Srednekolymsk"],
    [[-35.6855, -72.691], "America/Santiago"],
    [[74.5584, 55.9747], "Europe/Moscow"],
    [[76.1433, -53.2798], "America/Nuuk"],
    [[0.7285, 126.0147], "Asia/Jayapura"],
    [[-88.8327, 95.8183], "Antarctica/McMurdo"],
    [[-28.4432, 127.0919], "Australia/Perth"],
    [[-4.3531, 133.3652], "Asia/Jayapura"],
    [[62.9828, 129.7148], "Asia/Yakutsk"],
    [[-18.7275, 141.5951], "Australia/Brisbane"],
    [[3.7204, -54.941], "America/Paramaribo"],
    [[-74.8133, 99.7943], "Antarctica/Vostok"],
    [[26.6536, 23.084], "Africa/Tripoli"],
    [[-76.9545, 173.3725], "Antarctica/McMurdo"],
    [[-77.3173, 60.7945], "Antarctica/Mawson"],
    [[-71.555, 105.8101], "Antarctica/Vostok"],
    [[-82.3918, -39.9111], "America/Argentina/Ushuaia"],
    [[-38.9059, 176.476], "Pacific/Auckland"],
    [[79.0694, -101.0583], "America/Rankin_Inlet"],
    [[-8.3838, -40.0435], "America/Recife"],
    [[27.0494, 15.9137], "Africa/Tripoli"],
    [[81.1039, 65.0911], "Europe/Moscow"],
    [[57.1634, -90.2668], "America/Rankin_Inlet"],
    [[77.6601, -70.1981], "America/Thule"],
    [[81.0588, -66.5886], "America/Iqaluit"],
    [[68.8512, 171.3592], "Asia/Anadyr"],
    [[58.6908, 102.4371], "Asia/Krasnoyarsk"],
    [[-88.2361, 97.1364], "Antarctica/McMurdo"],
    [[71.6737, 93.9535], "Asia/Krasnoyarsk"],
    [[80.8353, -25.5244], "America/Nuuk"],
    [[52.9659, -9.6327], "Europe/Dublin"],
    [[18.3417, 77.4311], "Asia/Kolkata"],
    [[79.915, 95.4712], "Asia/Krasnoyarsk"],
    [[66.7668, -89.4273], "America/Rankin_Inlet"],
    [[-70.4481, 29.8544], "Antarctica/Syowa"],
    [[20.9409, 79.2901], "Asia/Kolkata"],
    [[-18.358, 26.8974], "Africa/Harare"],
    [[78.6706, -108.3721], "America/Cambridge_Bay"],
    [[4.4115, -72.1803], "America/Bogota"],
    [[51.4288, 72.2941], "Asia/Almaty"],
    [[-35.3917, -70.9078], "America/Santiago"],
    [[-88.9786, -113.2818], "Antarctica/McMurdo"],
    [[56.0264, -103.4582], "America/Regina"],
    [[-13.3947, -80.699], "America/Lima"],
    [[65.7962, -80.4917], "America/Iqaluit"],
    [[11.6194, -7.3504], "Africa/Bamako"],
    [[-88.2008, 126.11], "Antarctica/McMurdo"],
    [[-78.2866, -20.2204], "Antarctica/Rothera"],
    [[-3.1106, 22.9557], "Africa/Lubumbashi"],
    [[22.9036, -74.2531], "America/Nassau"],
    [[-71.8066, 104.0721], "Antarctica/Vostok"],
    [[18.9557, 99.3972], "Asia/Bangkok"],
    [[48.0728, -54.1551], "America/St_Johns"],
    [[-69.2325, 165.3139], "Antarctica/McMurdo"],
    [[69.5628, 168.2], "Asia/Anadyr"],
    [[5.3806, 163.194], "Pacific/Kosrae"],
    [[57.0813, -73.2488], "America/Toronto"],
    [[-71.239, 105.8529], "Antarctica/Vostok"],
    [[75.0493, 106.5847], "Asia/Krasnoyarsk"],
    [[28.9869, 98.6685], "Asia/Shanghai"],
    [[-88.5085, 119.8214], "Antarctica/McMurdo"],
    [[81.678, -16.1147], "America/Nuuk"],
    [[-66.6213, 128.0286], "Antarctica/DumontDUrville"],
    [[30.9835, 71.3536], "Asia/Karachi"],
    [[49.8747, 63.9115], "Asia/Qostanay"],
    [[22.587, 80.9961], "Asia/Kolkata"],
    [[-86.9962, -9.5774], "Antarctica/McMurdo"],
    [[-14.562, 36.499], "Africa/Maputo"],
    [[68.6209, 15.8492], "Europe/Oslo"],
    [[67.118, 145.8011], "Asia/Srednekolymsk"],
    [[35.2355, 115.1101], "Asia/Shanghai"],
    [[29.9031, 23.3859], "Africa/Tripoli"],
    [[13.4276, 7.9277], "Africa/Niamey"],
    [[45.847, -104.3556], "America/Denver"],
    [[45.8737, 12.069], "Europe/Rome"],
    [[28.3579, 26.2825], "Africa/Cairo"],
    [[-35.7382, -70.3924], "America/Santiago"],
    [[46.7566, 98.2388], "Asia/Ulaanbaatar"],
    [[-34.0824, 136.0465], "Australia/Adelaide"],
    [[-6.081, -39.0967], "America/Fortaleza"],
    [[61.9889, 85.5355], "Asia/Krasnoyarsk"],
    [[-79.793, 179.6504], "Antarctica/McMurdo"],
    [[34.4982, 88.0508], "Asia/Shanghai"],
    [[45.7538, 73.9869], "Asia/Almaty"],
    [[65.5056, -17.8821], "Atlantic/Reykjavik"],
    [[31.0275, 29.8079], "Africa/Cairo"],
    [[26.8254, 93.8305], "Asia/Kolkata"],
    [[45.3979, 101.1227], "Asia/Ulaanbaatar"],
    [[70.6513, -70.3599], "America/Iqaluit"],
    [[-74.5407, 73.9729], "Antarctica/Mawson"],
    [[-13.902, 33.1248], "Africa/Blantyre"],
    [[-67.4349, 58.8243], "Antarctica/Mawson"],
    [[-83.4542, -55.3405], "America/Argentina/Ushuaia"],
    [[61.9607, 100.375], "Asia/Krasnoyarsk"],
    [[-80.1951, 149.6521], "Australia/Perth"],
    [[-9.8853, -38.8553], "America/Bahia"],
    [[65.2086, -70.7116], "America/Iqaluit"],
    [[-87.5214, 36.7399], "Antarctica/McMurdo"],
    [[-64.0147, -61.476], "America/Argentina/Ushuaia"],
    [[25.4041, 11.3742], "Africa/Tripoli"],
    [[25.0798, 16.0602], "Africa/Tripoli"],
    [[52.8815, 69.7176], "Asia/Almaty"],
    [[15.5559, -0.8798], "Africa/Bamako"],
    [[51.9008, 47.1553], "Europe/Saratov"],
    [[-70.3257, 177.6174], "Antarctica/McMurdo"],
    [[57.1585, -127.6091], "America/Vancouver"],
    [[-24.8144, 113.1043], "Australia/Perth"],
    [[-85.969, 74.3806], "Antarctica/Mawson"],
    [[-6.1779, 131.7016], "Asia/Jayapura"],
    [[-81.79, 156.3622], "Australia/Perth"],
    [[17.573, 41.2407], "Asia/Riyadh"],
    [[65.8999, 126.9031], "Asia/Yakutsk"],
    [[-86.5903, 165.8557], "Antarctica/McMurdo"],
    [[61.4731, 149.1582], "Asia/Magadan"],
    [[22.6239, -78.1592], "America/Nassau"],
    [[52.0739, -76.2105], "America/Toronto"],
    [[71.9161, 112.6824], "Asia/Yakutsk"],
    [[62.8513, -169.4547], "America/Nome"],
    [[-48.9439, -75.5842], "America/Punta_Arenas"],
    [[12.488, 36.0027], "Africa/Addis_Ababa"],
    [[69.1258, 112.0245], "Asia/Yakutsk"],
    [[32.8811, 75.0941], "Asia/Kolkata"],
    [[-87.9378, 13.755], "Antarctica/McMurdo"],
    [[-17.2104, 124.6772], "Australia/Perth"],
    [[-75.1946, 169.6915], "Antarctica/McMurdo"],
    [[-84.1473, 98.5102], "Antarctica/Vostok"],
    [[9.9503, 122.0476], "Asia/Manila"],
    [[38.9061, -107.8604], "America/Denver"],
    [[-31.3543, 123.8906], "Australia/Perth"],
    [[-80.0364, -1.849], "Africa/Johannesburg"],
    [[-79.7863, 12.823], "Antarctica/Troll"],
    [[9.237, 8.1028], "Africa/Lagos"],
    [[53.3415, -3.8199], "Europe/London"],
    [[35.924, 109.7436], "Asia/Shanghai"],
    [[66.0473, 31.2121], "Europe/Moscow"],
    [[44.5273, 102.7418], "Asia/Ulaanbaatar"],
    [[-20.7782, 128.2613], "Australia/Perth"],
    [[25.3184, 106.5474], "Asia/Shanghai"],
    [[78.8698, -32.8473], "America/Nuuk"],
    [[-33.0014, -64.8719], "America/Argentina/Cordoba"],
    [[-16.5386, -74.3819], "America/Lima"],
    [[19.3416, 40.9026], "Asia/Riyadh"],
    [[-84.7211, -169.543], "Antarctica/McMurdo"],
    [[-65.2406, 158.5203], "Antarctica/DumontDUrville"],
    [[-88.3253, 132.9353], "Antarctica/McMurdo"],
    [[16.3107, -6.0296], "Africa/Nouakchott"],
    [[30.0324, 5.1385], "Africa/Algiers"],
    [[-6.0718, -56.8487], "America/Santarem"],
    [[-76.8316, 59.5286], "Antarctica/Mawson"],
    [[65.4686, 99.3694], "Asia/Krasnoyarsk"],
    [[36.4845, 106.5745], "Asia/Shanghai"],
    [[-70.7261, 143.986], "Australia/Perth"],
    [[20.2868, -7.3713], "Africa/Nouakchott"],
    [[66.3293, 31.5388], "Europe/Moscow"],
    [[-86.8475, -13.1719], "Antarctica/McMurdo"],
    [[59.8096, 116.8943], "Asia/Irkutsk"],
    [[-82.0344, -63.0449], "America/Argentina/Ushuaia"],
    [[49.109, -54.269], "America/St_Johns"],
    [[4.4875, -77.4851], "America/Bogota"],
    [[60.7647, 26.4242], "Europe/Helsinki"],
    [[-72.2672, 87.7772], "Antarctica/Vostok"],
    [[-30.69, 139.2318], "Australia/Adelaide"],
    [[19.6708, 24.8796], "Africa/Khartoum"],
    [[17.461, 20.0002], "Africa/Ndjamena"],
    [[23.5709, 101.6375], "Asia/Shanghai"],
    [[75.9748, 105.0532], "Asia/Krasnoyarsk"],
    [[77.4624, -73.2223], "America/Thule"],
    [[59.8796, 14.399], "Europe/Stockholm"],
    [[44.839, -92.373], "America/Chicago"],
    [[62.0601, -104.1887], "America/Edmonton"],
    [[42.2095, -2.4099], "Europe/Madrid"],
    [[-88.0545, -95.0714], "Antarctica/McMurdo"],
    [[-5.9429, -43.007], "America/Fortaleza"],
    [[-87.0159, -85.9556], "Antarctica/McMurdo"],
    [[-4.4307, -56.4399], "America/Santarem"],
    [[54.7497, 50.0961], "Europe/Moscow"],
    [[-24.3478, 25.9956], "Africa/Gaborone"],
    [[-6.4392, -58.384], "America/Manaus"],
    [[81.9952, -60.5954], "America/Nuuk"],
    [[68.3685, 23.2111], "Europe/Helsinki"],
    [[-24.6704, 30.5744], "Africa/Johannesburg"],
    [[-85.4897, -155.3197], "Antarctica/McMurdo"],
    [[-84.4852, 40.0577], "Antarctica/Syowa"],
    [[-87.929, -89.7194], "Antarctica/McMurdo"],
    [[-2.4132, 35.8827], "Africa/Dar_es_Salaam"],
    [[46.9555, -110.178], "America/Denver"],
    [[-81.645, -73.4636], "Antarctica/Rothera"],
    [[67.4735, 76.7036], "Asia/Yekaterinburg"],
    [[-47.417, -71.1926], "America/Argentina/Rio_Gallegos"],
    [[-83.5038, 49.1096], "Antarctica/Syowa"],
    [[56.4565, 36.8704], "Europe/Moscow"],
    [[-84.5089, 56.3004], "Antarctica/Mawson"],
    [[14.5571, 7.1021], "Africa/Niamey"],
    [[-85.1045, 166.8727], "Antarctica/McMurdo"],
    [[-86.0662, -174.076], "Antarctica/McMurdo"],
    [[47.0722, -1.9744], "Europe/Paris"],
    [[-87.5072, -161.3385], "Antarctica/McMurdo"],
    [[66.0441, -96.949], "America/Rankin_Inlet"],
    [[56.4369, 90.933], "Asia/Krasnoyarsk"],
    [[67.4068, -123.1871], "America/Inuvik"],
    [[22.3989, 101.9252], "Asia/Vientiane"],
    [[-87.5659, 14.7744], "Antarctica/McMurdo"],
    [[55.6859, -86.2914], "America/Toronto"],
    [[-89.5274, -161.9818], "Antarctica/McMurdo"],
    [[14.0525, -0.5529], "Africa/Ouagadougou"],
    [[-19.9091, 30.927], "Africa/Harare"],
    [[54.7107, -87.6633], "America/Toronto"],
    [[-6.4873, -45.3957], "America/Fortaleza"],
    [[-19.97, -47.674], "America/Sao_Paulo"],
    [[70.6514, -51.669], "America/Nuuk"],
    [[47.9776, 62.9287], "Asia/Aqtobe"],
    [[51.1392, 14.5513], "Europe/Berlin"],
    [[-88.9514, 21.0688], "Antarctica/McMurdo"],
    [[37.4775, -118.7622], "America/Los_Angeles"],
    [[-20.1579, 131.9759], "Australia/Darwin"],
    [[11.9106, 37.8002], "Africa/Addis_Ababa"],
    [[-72.673, 131.1267], "Australia/Perth"],
    [[-77.6577, 140.032], "Australia/Perth"],
    [[-88.393, 88.6893], "Antarctica/McMurdo"],
    [[42.1385, -73.7371], "America/New_York"],
    [[-3.4093, -48.6685], "America/Belem"],
    [[-85.8343, 40.7325], "Antarctica/Syowa"],
    [[-69.2213, 11.7982], "Antarctica/Troll"],
    [[-77.4848, -175.7853], "Antarctica/McMurdo"],
    [[-79.0896, 105.5423], "Antarctica/Vostok"],
    [[73.838, 113.6616], "Asia/Yakutsk"],
    [[67.5706, 136.2093], "Asia/Vladivostok"],
    [[46.6776, 26.3822], "Europe/Bucharest"],
    [[80.7574, -79.2951], "America/Iqaluit"],
    [[67.5891, -116.0222], "America/Cambridge_Bay"],
    [[81.6416, -30.4912], "America/Nuuk"],
    [[-37.5253, -65.214], "America/Argentina/Salta"],
  ];

  TestCases.forEach(pass);

  function rnd(min, max) {
    return Math.random() * (max - min) + min;
  }

  if (globalThis.window == null) {
    const iters = 50_000; // GHA on mac times out if this is 100k
    const { Info } = require("luxon");
    const { find } = require("geo-tz");
    const inhabited = require("inhabited");

    const locs = [];
    for (let iter = 0; iter < iters; iter++) {
      locs.push([rnd(-90, 90), rnd(-180, 180)]);
    }
    function elapsed(f, num = iters) {
      const start = process?.hrtime?.bigint();
      for (let iter = 0; iter < num; iter++) {
        f(...locs[iter]);
      }
      const end = process?.hrtime?.bigint();
      if (start != null && end != null && iters === num) {
        const msElapsed = Number(end - start) / 1000;
        console.log((msElapsed / num).toFixed(3) + "ms per iteration", {
          msElapsed,
        });
      }
    }
    it("speed test for no-op", function () {
      function noop() {}
      elapsed(noop);
    });
    it("speed test for geo-tz (warmup)", function () {
      elapsed(find, 100);
    });
    it("speed test for tz-lookup (warmup)", function () {
      elapsed(tz, 100);
    });
    it("speed test for geo-tz", function () {
      elapsed(find);
    });
    it("speed test for tz-lookup", function () {
      elapsed(tz);
    });
    it("speed test for geo-tz (cached)", function () {
      elapsed(find);
    });
    it("speed test for tz-lookup (cached)", function () {
      elapsed(tz);
    });

    it("Matches random locations", () => {
      let matches = 0;
      const errors = [];
      for (let iter = 0; iter < iters; iter++) {
        const lat = rnd(-90, 90);
        const lon = rnd(-180, 180);

        // standard timestamp:
        const ts1 = new Date("2021-01-01T00:00:00Z").getTime();
        // "summer" or DST timestamp:
        const ts2 = new Date("2021-08-01T00:00:00Z").getTime();

        // if we test only "inhabited" locations, we only see ~5% incorrect
        // timezones. This jumps to 30% if we test marine locations.
        if (inhabited(lat, lon)) {
          try {
            assert_any_iana_eql(tz(lat, lon), find(lat, lon));
            matches++;
          } catch (error) {
            errors.push({
              lat: lat.toFixed(3),
              lon: lon.toFixed(3),
              error: error.message,
            });
          }
        }
      }
      const percentMismatch = Math.round((100 * errors.length) / matches);
      console.log({ percentMismatch, errors: errors.slice(0, 10) });
      if (percentMismatch > 8) {
        throw new Error("Too many errors");
      }
    });
  }

  // Sanity-check that bad inputs fail.
  [
    [100, 10],
    [10, 190],
    ["hello", 10],
    [10, "hello"],
    [undefined, undefined],
    [{ lat: 10, lon: 10 }],
  ].forEach(fail);
});
