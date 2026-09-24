import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.nio.charset.StandardCharsets;

public class ContractCheck {

    public static void main(String[] args) throws Exception {
        Class<?> sensorClass = Class.forName("br.com.tracevia.wimservice.Main$VehicleSensor");
        Method parse = accessible(sensorClass.getDeclaredMethod("parse", byte[].class));
        Method axleWt = accessible(sensorClass.getDeclaredMethod("axleWt", int.class));
        Method spacing = accessible(sensorClass.getDeclaredMethod("spacing", int.class));

        BufferedReader reader = new BufferedReader(new InputStreamReader(System.in, StandardCharsets.UTF_8));
        String line;
        while ((line = reader.readLine()) != null) {
            line = line.trim();
            if (line.isEmpty()) continue;
            Object sensor = parse.invoke(null, (Object) hexToBytes(line));
            StringBuilder out = new StringBuilder("{");
            append(out, "numAxles", field(sensor, "numAxles"));
            append(out, "classIndex", field(sensor, "classIndex"));
            append(out, "serial", field(sensor, "serial"));
            appendText(out, "classCode", (String) call(sensor, "classText"));
            append(out, "lane", field(sensor, "lane"));
            append(out, "speedKmh", call(sensor, "speed"));
            append(out, "length", field(sensor, "length"));
            append(out, "gapCm", call(sensor, "gap"));
            append(out, "temperatureC", call(sensor, "temperature"));
            append(out, "gross", field(sensor, "gross"));
            append(out, "headwayMs", call(sensor, "headway"));
            appendText(out, "dateStart", (String) call(sensor, "dateStart"));
            out.append("\"axleWeights\":[");
            for (int i = 1; i <= 10; i++) out.append(i > 1 ? "," : "").append(axleWt.invoke(sensor, i));
            out.append("],\"axleSpacings\":[");
            for (int i = 1; i <= 9; i++) out.append(i > 1 ? "," : "").append(spacing.invoke(sensor, i));
            out.append("]}");
            System.out.println(out);
        }
    }

    private static Method accessible(Method method) {
        method.setAccessible(true);
        return method;
    }

    private static Object field(Object target, String name) throws Exception {
        Field field = target.getClass().getDeclaredField(name);
        field.setAccessible(true);
        return field.get(target);
    }

    private static Object call(Object target, String name) throws Exception {
        return accessible(target.getClass().getDeclaredMethod(name)).invoke(target);
    }

    private static void append(StringBuilder out, String key, Object value) {
        out.append('"').append(key).append("\":").append(value).append(',');
    }

    private static void appendText(StringBuilder out, String key, String value) {
        out.append('"').append(key).append("\":\"").append(value.replace("\\", "\\\\").replace("\"", "\\\"")).append("\",");
    }

    private static byte[] hexToBytes(String hex) {
        byte[] bytes = new byte[hex.length() / 2];
        for (int i = 0; i < bytes.length; i++) {
            bytes[i] = (byte) Integer.parseInt(hex.substring(i * 2, i * 2 + 2), 16);
        }
        return bytes;
    }
}
